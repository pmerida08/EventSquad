-- ── 1. Recrear join_group sin el check de verificación de identidad ───────────
create or replace function public.join_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_max      int;
  v_count    int;
  v_in_event boolean;
begin
  -- 1. Obtener el evento del grupo
  select event_id, max_members
    into v_event_id, v_max
    from public.groups
   where id = p_group_id;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  -- 2. Verificar que el usuario no está ya en otro grupo del mismo evento
  select exists (
    select 1
      from public.group_members gm
      join public.groups g on g.id = gm.group_id
     where gm.user_id = auth.uid()
       and g.event_id = v_event_id
  ) into v_in_event;

  if v_in_event then
    raise exception 'ALREADY_IN_GROUP';
  end if;

  -- 3. Verificar capacidad
  select count(*) into v_count
    from public.group_members
   where group_id = p_group_id;

  if v_count >= v_max then
    raise exception 'GROUP_FULL';
  end if;

  -- 4. Insertar
  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, auth.uid(), 'member');
end;
$$;

-- ── 2. Tabla user_reports ─────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id           uuid        primary key default gen_random_uuid(),
  group_id     uuid        not null references public.groups(id) on delete cascade,
  reporter_id  uuid        not null references public.profiles(id) on delete cascade,
  reported_id  uuid        not null references public.profiles(id) on delete cascade,
  reason       text        not null check (char_length(reason) between 1 and 500),
  created_at   timestamptz not null default now(),
  unique (group_id, reporter_id, reported_id)
);

create index if not exists ur_group_idx    on public.user_reports(group_id);
create index if not exists ur_reported_idx on public.user_reports(reported_id);

alter table public.user_reports enable row level security;
grant select on public.user_reports to authenticated;

-- Solo los miembros del grupo pueden ver los reportes de ese grupo
create policy "ur_select_members"
  on public.user_reports for select
  using (
    exists (
      select 1 from public.group_members
       where group_id = user_reports.group_id
         and user_id  = auth.uid()
    )
  );

-- ── 3. Tabla kick_votes ───────────────────────────────────────────────────────
create table if not exists public.kick_votes (
  group_id   uuid        not null references public.groups(id) on delete cascade,
  target_id  uuid        not null references public.profiles(id) on delete cascade,
  voter_id   uuid        not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, target_id, voter_id)
);

create index if not exists kv_group_target_idx on public.kick_votes(group_id, target_id);

alter table public.kick_votes enable row level security;
grant select on public.kick_votes to authenticated;

-- Solo los miembros del grupo pueden ver los votos de expulsión
create policy "kv_select_members"
  on public.kick_votes for select
  using (
    exists (
      select 1 from public.group_members
       where group_id = kick_votes.group_id
         and user_id  = auth.uid()
    )
  );

-- ── 4. RPC report_user ────────────────────────────────────────────────────────
create or replace function public.report_user(
  p_group_id    uuid,
  p_reported_id uuid,
  p_reason      text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Verificar que el reporter es miembro del grupo
  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'NOT_MEMBER';
  end if;

  -- No puede reportarse a sí mismo
  if auth.uid() = p_reported_id then
    raise exception 'SELF_REPORT';
  end if;

  -- Verificar que el reportado es miembro del grupo
  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = p_reported_id
  ) then
    raise exception 'USER_NOT_IN_GROUP';
  end if;

  -- Insertar o actualizar reporte
  insert into public.user_reports (group_id, reporter_id, reported_id, reason)
  values (p_group_id, auth.uid(), p_reported_id, p_reason)
  on conflict (group_id, reporter_id, reported_id) do update
    set reason = excluded.reason, created_at = now();
end;
$$;

grant execute on function public.report_user to authenticated;

-- ── 5. RPC vote_kick_user ─────────────────────────────────────────────────────
create or replace function public.vote_kick_user(
  p_group_id  uuid,
  p_target_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_members int;
  v_vote_count    int;
  v_target_role   text;
begin
  -- Verificar que el votante es miembro
  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = auth.uid()
  ) then
    raise exception 'NOT_MEMBER';
  end if;

  -- No puede votarse para echarse a sí mismo
  if auth.uid() = p_target_id then
    raise exception 'SELF_VOTE';
  end if;

  -- Obtener el rol del target
  select role into v_target_role
    from public.group_members
   where group_id = p_group_id and user_id = p_target_id;

  if not found then
    raise exception 'USER_NOT_IN_GROUP';
  end if;

  -- No se puede votar para echar al owner
  if v_target_role = 'owner' then
    raise exception 'CANNOT_KICK_OWNER';
  end if;

  -- Insertar voto (PK evita duplicados, on conflict es no-op)
  insert into public.kick_votes (group_id, target_id, voter_id)
  values (p_group_id, p_target_id, auth.uid())
  on conflict do nothing;

  -- Contar votos actuales para este target
  select count(*) into v_vote_count
    from public.kick_votes
   where group_id = p_group_id and target_id = p_target_id;

  -- Contar miembros no-target (los que pueden votar)
  select count(*) into v_total_members
    from public.group_members
   where group_id = p_group_id and user_id != p_target_id;

  -- Expulsar si mayoría estricta (> 50%)
  if v_total_members > 0 and v_vote_count > (v_total_members::float / 2.0) then
    delete from public.group_members
     where group_id = p_group_id and user_id = p_target_id;

    delete from public.kick_votes
     where group_id = p_group_id and target_id = p_target_id;
  end if;
end;
$$;

grant execute on function public.vote_kick_user to authenticated;

-- ── 6. RPC kick_member (solo owner) ──────────────────────────────────────────
create or replace function public.kick_member(
  p_group_id  uuid,
  p_target_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller_role text;
begin
  -- Obtener rol del caller
  select role into v_caller_role
    from public.group_members
   where group_id = p_group_id and user_id = auth.uid();

  if not found then
    raise exception 'NOT_MEMBER';
  end if;

  -- Solo el owner puede echar miembros directamente
  if v_caller_role != 'owner' then
    raise exception 'NOT_OWNER';
  end if;

  -- No puede echarse a sí mismo
  if auth.uid() = p_target_id then
    raise exception 'SELF_KICK';
  end if;

  -- Verificar que el target está en el grupo
  if not exists (
    select 1 from public.group_members
     where group_id = p_group_id and user_id = p_target_id
  ) then
    raise exception 'USER_NOT_IN_GROUP';
  end if;

  -- Eliminar al miembro
  delete from public.group_members
   where group_id = p_group_id and user_id = p_target_id;

  -- Limpiar sus votos de expulsión pendientes
  delete from public.kick_votes
   where group_id = p_group_id and target_id = p_target_id;
end;
$$;

grant execute on function public.kick_member to authenticated;
