-- ── Tabla groups ─────────────────────────────────────────────────────────────
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  description text,
  max_members int  not null default 10 check (max_members between 2 and 50),
  created_by  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists groups_event_idx on public.groups(event_id);

alter table public.groups enable row level security;

grant select on public.groups to anon, authenticated;
grant insert, update, delete on public.groups to authenticated;

-- Lectura pública
create policy "groups_select_public"
  on public.groups for select using (true);

-- Solo el creador puede actualizar/eliminar
create policy "groups_update_owner"
  on public.groups for update using (auth.uid() = created_by);

create policy "groups_delete_owner"
  on public.groups for delete using (auth.uid() = created_by);

-- Cualquier usuario autenticado puede crear un grupo
create policy "groups_insert_authenticated"
  on public.groups for insert with check (auth.uid() = created_by);

-- ── Tabla group_members ───────────────────────────────────────────────────────
create table if not exists public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists gm_group_idx on public.group_members(group_id);
create index if not exists gm_user_idx  on public.group_members(user_id);

alter table public.group_members enable row level security;

grant select on public.group_members to anon, authenticated;
grant insert, delete on public.group_members to authenticated;

create policy "gm_select_public"
  on public.group_members for select using (true);

create policy "gm_delete_own"
  on public.group_members for delete using (auth.uid() = user_id);

-- ── Vista groups_with_member_count ────────────────────────────────────────────
create or replace view public.groups_with_member_count
  with (security_invoker = true)
as
  select
    g.*,
    count(gm.user_id)::int as member_count
  from public.groups g
  left join public.group_members gm on gm.group_id = g.id
  group by g.id;

grant select on public.groups_with_member_count to anon, authenticated;

-- ── RPC join_group ────────────────────────────────────────────────────────────
create or replace function public.join_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id   uuid;
  v_max        int;
  v_count      int;
  v_verified   boolean;
  v_in_event   boolean;
begin
  -- 1. Obtener el evento del grupo
  select event_id, max_members
    into v_event_id, v_max
    from public.groups
   where id = p_group_id;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  -- 2. Verificar que el usuario tiene identidad verificada
  select verified into v_verified
    from public.profiles
   where id = auth.uid();

  if not v_verified then
    raise exception 'UNVERIFIED';
  end if;

  -- 3. Verificar que el usuario no está ya en otro grupo del mismo evento
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

  -- 4. Verificar capacidad
  select count(*) into v_count
    from public.group_members
   where group_id = p_group_id;

  if v_count >= v_max then
    raise exception 'GROUP_FULL';
  end if;

  -- 5. Insertar
  insert into public.group_members (group_id, user_id, role)
  values (p_group_id, auth.uid(), 'member');
end;
$$;

grant execute on function public.join_group to authenticated;
