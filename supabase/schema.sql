create table if not exists public.account_data (
  owner_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('events', 'tasks', 'diary')),
  record_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, collection, record_id)
);

alter table public.account_data enable row level security;
grant select, insert, update, delete on public.account_data to authenticated;

drop policy if exists "Users manage their own planner data" on public.account_data;
create policy "Users manage their own planner data"
  on public.account_data
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
