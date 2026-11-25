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

create table if not exists public.friend_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  invite_code text not null unique
);

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create unique index if not exists friend_requests_one_pending_pair
  on public.friend_requests (least(requester_id, recipient_id), greatest(requester_id, recipient_id))
  where status = 'pending';

create table if not exists public.friendships (
  user_a uuid not null references auth.users(id) on delete cascade,
  user_b uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.friend_shares (
  owner_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in ('events', 'tasks', 'diary')),
  record_id text not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id, collection, record_id),
  foreign key (owner_id, collection, record_id)
    references public.account_data(owner_id, collection, record_id) on delete cascade,
  check (owner_id <> friend_id)
);

alter table public.friend_profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.friend_shares enable row level security;

revoke all on public.friend_profiles, public.friend_requests, public.friendships, public.friend_shares from anon, authenticated;

create or replace function public.w2d_create_friend_profile()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.friend_profiles(user_id, invite_code)
  values (new.id, upper(replace(gen_random_uuid()::text, '-', '')))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists w2d_auth_user_friend_profile on auth.users;
create trigger w2d_auth_user_friend_profile
  after insert on auth.users
  for each row execute function public.w2d_create_friend_profile();

insert into public.friend_profiles(user_id, invite_code)
select u.id, upper(replace(gen_random_uuid()::text, '-', ''))
from auth.users u
on conflict (user_id) do nothing;

create or replace function public.w2d_friend_dashboard()
returns jsonb
language sql
stable
security definer
set search_path = public, auth
as $$
  select jsonb_build_object(
    'invite_code', (select p.invite_code from public.friend_profiles p where p.user_id = auth.uid()),
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'email', u.email, 'created_at', r.created_at) order by r.created_at)
      from public.friend_requests r join auth.users u on u.id = r.requester_id
      where r.recipient_id = auth.uid() and r.status = 'pending'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'email', u.email, 'created_at', r.created_at) order by r.created_at)
      from public.friend_requests r join auth.users u on u.id = r.recipient_id
      where r.requester_id = auth.uid() and r.status = 'pending'
    ), '[]'::jsonb),
    'friends', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.friend_id,
        'email', u.email,
        'shared_items', coalesce((
          select jsonb_agg(jsonb_build_object('collection', s.collection, 'record_id', s.record_id))
          from public.friend_shares s
          where s.owner_id = auth.uid() and s.friend_id = f.friend_id
        ), '[]'::jsonb)
      ) order by u.email)
      from (
        select case when p.user_a = auth.uid() then p.user_b else p.user_a end as friend_id
        from public.friendships p
        where p.user_a = auth.uid() or p.user_b = auth.uid()
      ) f join auth.users u on u.id = f.friend_id
    ), '[]'::jsonb)
  );
$$;

create or replace function public.w2d_send_friend_request_email(p_email text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
  v_friend uuid;
begin
  if v_me is null then raise exception 'Sign in to send a friend request.'; end if;
  select u.id into v_friend from auth.users u
  where lower(u.email) = lower(trim(p_email)) and u.id <> v_me
  limit 1;
  if v_friend is null then return; end if;
  if exists (select 1 from public.friendships f where f.user_a = least(v_me, v_friend) and f.user_b = greatest(v_me, v_friend)) then
    raise exception 'You are already friends with this account.';
  end if;
  insert into public.friend_requests(requester_id, recipient_id)
  values (v_me, v_friend)
  on conflict do nothing;
end;
$$;

create or replace function public.w2d_send_friend_request_code(p_code text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
  v_friend uuid;
begin
  if v_me is null then raise exception 'Sign in to use an invite code.'; end if;
  select p.user_id into v_friend from public.friend_profiles p
  where p.invite_code = upper(trim(p_code)) and p.user_id <> v_me;
  if v_friend is null then raise exception 'That invite code is not valid.'; end if;
  if exists (select 1 from public.friendships f where f.user_a = least(v_me, v_friend) and f.user_b = greatest(v_me, v_friend)) then
    raise exception 'You are already friends with this account.';
  end if;
  insert into public.friend_requests(requester_id, recipient_id)
  values (v_me, v_friend)
  on conflict do nothing;
end;
$$;

create or replace function public.w2d_respond_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_request public.friend_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in to respond to friend requests.'; end if;
  update public.friend_requests
  set status = case when p_accept then 'accepted' else 'declined' end
  where id = p_request_id and recipient_id = auth.uid() and status = 'pending'
  returning * into v_request;
  if not found then raise exception 'That friend request is no longer available.'; end if;
  if p_accept then
    insert into public.friendships(user_a, user_b)
    values (least(v_request.requester_id, v_request.recipient_id), greatest(v_request.requester_id, v_request.recipient_id))
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.w2d_remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Sign in to remove a friend.'; end if;
  delete from public.friendships
  where user_a = least(v_me, p_friend_id) and user_b = greatest(v_me, p_friend_id);
  if not found then raise exception 'That friendship no longer exists.'; end if;
  delete from public.friend_shares
  where (owner_id = v_me and friend_id = p_friend_id) or (owner_id = p_friend_id and friend_id = v_me);
end;
$$;

create or replace function public.w2d_set_shared_item(p_friend_id uuid, p_collection text, p_record_id text, p_shared boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Sign in to change sharing settings.'; end if;
  if p_collection not in ('events', 'tasks', 'diary') then raise exception 'That item type cannot be shared.'; end if;
  if not exists (
    select 1 from public.friendships f
    where f.user_a = least(v_me, p_friend_id) and f.user_b = greatest(v_me, p_friend_id)
  ) then raise exception 'Accept the friend request before sharing items.'; end if;
  if p_shared then
    if not exists (
      select 1 from public.account_data d
      where d.owner_id = v_me and d.collection = p_collection and d.record_id = p_record_id
    ) then raise exception 'This item has not synced to your account yet. Try again after sync completes.'; end if;
    insert into public.friend_shares(owner_id, friend_id, collection, record_id)
    values (v_me, p_friend_id, p_collection, p_record_id)
    on conflict do nothing;
  else
    delete from public.friend_shares
    where owner_id = v_me and friend_id = p_friend_id and collection = p_collection and record_id = p_record_id;
  end if;
end;
$$;

create or replace function public.w2d_friend_schedule(p_friend_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_me uuid := auth.uid();
  v_records jsonb;
begin
  if v_me is null then raise exception 'Sign in to view a shared calendar.'; end if;
  if not exists (
    select 1 from public.friendships f
    where f.user_a = least(v_me, p_friend_id) and f.user_b = greatest(v_me, p_friend_id)
  ) then raise exception 'That calendar is not shared with you.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'collection', s.collection,
    'record_id', s.record_id,
    'payload', case
      when s.collection = 'diary' then jsonb_build_object(
        'id', d.record_id,
        'date', d.payload->'date',
        'title', d.payload->'title'
      )
      else d.payload - 'notes' - 'remind' - 'remindAt'
    end
  )), '[]'::jsonb)
  into v_records
  from public.friend_shares s
  join public.account_data d on d.owner_id = s.owner_id and d.collection = s.collection and d.record_id = s.record_id
  where s.owner_id = p_friend_id and s.friend_id = v_me;
  return v_records;
end;
$$;

revoke all on function public.w2d_friend_dashboard() from public, anon;
revoke all on function public.w2d_send_friend_request_email(text) from public, anon;
revoke all on function public.w2d_send_friend_request_code(text) from public, anon;
revoke all on function public.w2d_respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.w2d_remove_friend(uuid) from public, anon;
revoke all on function public.w2d_set_shared_item(uuid, text, text, boolean) from public, anon;
revoke all on function public.w2d_friend_schedule(uuid) from public, anon;
grant execute on function public.w2d_friend_dashboard() to authenticated;
grant execute on function public.w2d_send_friend_request_email(text) to authenticated;
grant execute on function public.w2d_send_friend_request_code(text) to authenticated;
grant execute on function public.w2d_respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.w2d_remove_friend(uuid) to authenticated;
grant execute on function public.w2d_set_shared_item(uuid, text, text, boolean) to authenticated;
grant execute on function public.w2d_friend_schedule(uuid) to authenticated;
