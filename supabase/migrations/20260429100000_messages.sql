-- ── Tabla messages ────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid        primary key default gen_random_uuid(),
  group_id   uuid        not null references public.groups(id)   on delete cascade,
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  content    text        not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- Índice compuesto para queries paginadas eficientes
create index if not exists messages_group_created_idx
  on public.messages (group_id, created_at desc);

-- Índice para queries por usuario (ej. borrado de cuenta)
create index if not exists messages_user_idx
  on public.messages (user_id);

alter table public.messages enable row level security;

grant select, insert on public.messages to authenticated;

-- Solo miembros del grupo pueden leer sus mensajes
create policy "messages_select_members"
  on public.messages for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id
        and gm.user_id  = auth.uid()
    )
  );

-- Solo miembros pueden escribir y solo como sí mismos
create policy "messages_insert_members"
  on public.messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members gm
      where gm.group_id = messages.group_id
        and gm.user_id  = auth.uid()
    )
  );

-- Activar Realtime para la tabla messages
alter publication supabase_realtime add table public.messages;
