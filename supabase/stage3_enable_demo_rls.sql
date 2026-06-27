-- Stage 3 temporary RLS for the current DEMO_USER_ID architecture.
-- Replace these demo policies when Telegram user/profile ownership is implemented.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
  before update on public.deals
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;
drop policy if exists "Demo profile can be read" on public.profiles;
drop policy if exists "Demo profile can be inserted" on public.profiles;
drop policy if exists "Demo profile can be updated" on public.profiles;

drop policy if exists "Users can read own clients" on public.clients;
drop policy if exists "Users can insert own clients" on public.clients;
drop policy if exists "Users can update own clients" on public.clients;
drop policy if exists "Users can delete own clients" on public.clients;
drop policy if exists "Demo clients can be read" on public.clients;
drop policy if exists "Demo clients can be inserted" on public.clients;
drop policy if exists "Demo clients can be updated" on public.clients;
drop policy if exists "Demo clients can be deleted" on public.clients;

drop policy if exists "Users can read own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;
drop policy if exists "Demo tasks can be read" on public.tasks;
drop policy if exists "Demo tasks can be inserted" on public.tasks;
drop policy if exists "Demo tasks can be updated" on public.tasks;
drop policy if exists "Demo tasks can be deleted" on public.tasks;

drop policy if exists "Users can read own deals" on public.deals;
drop policy if exists "Users can insert own deals" on public.deals;
drop policy if exists "Users can update own deals" on public.deals;
drop policy if exists "Users can delete own deals" on public.deals;
drop policy if exists "Demo deals can be read" on public.deals;
drop policy if exists "Demo deals can be inserted" on public.deals;
drop policy if exists "Demo deals can be updated" on public.deals;
drop policy if exists "Demo deals can be deleted" on public.deals;

drop policy if exists "Users can read own activities" on public.activities;
drop policy if exists "Users can insert own activities" on public.activities;
drop policy if exists "Users can update own activities" on public.activities;
drop policy if exists "Users can delete own activities" on public.activities;
drop policy if exists "Demo activities can be read" on public.activities;
drop policy if exists "Demo activities can be inserted" on public.activities;
drop policy if exists "Demo activities can be updated" on public.activities;
drop policy if exists "Demo activities can be deleted" on public.activities;

create policy "Demo profile can be read"
  on public.profiles
  for select
  to anon, authenticated
  using (id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo profile can be inserted"
  on public.profiles
  for insert
  to anon, authenticated
  with check (id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo profile can be updated"
  on public.profiles
  for update
  to anon, authenticated
  using (id = '11111111-1111-1111-1111-111111111111'::uuid)
  with check (id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo clients can be read"
  on public.clients
  for select
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo clients can be inserted"
  on public.clients
  for insert
  to anon, authenticated
  with check (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo clients can be updated"
  on public.clients
  for update
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid)
  with check (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo clients can be deleted"
  on public.clients
  for delete
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo tasks can be read"
  on public.tasks
  for select
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo tasks can be inserted"
  on public.tasks
  for insert
  to anon, authenticated
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = tasks.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo tasks can be updated"
  on public.tasks
  for update
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid)
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = tasks.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo tasks can be deleted"
  on public.tasks
  for delete
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo deals can be read"
  on public.deals
  for select
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo deals can be inserted"
  on public.deals
  for insert
  to anon, authenticated
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = deals.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo deals can be updated"
  on public.deals
  for update
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid)
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = deals.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo deals can be deleted"
  on public.deals
  for delete
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo activities can be read"
  on public.activities
  for select
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);

create policy "Demo activities can be inserted"
  on public.activities
  for insert
  to anon, authenticated
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = activities.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo activities can be updated"
  on public.activities
  for update
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid)
  with check (
    user_id = '11111111-1111-1111-1111-111111111111'::uuid
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = activities.client_id
          and clients.user_id = '11111111-1111-1111-1111-111111111111'::uuid
      )
    )
  );

create policy "Demo activities can be deleted"
  on public.activities
  for delete
  to anon, authenticated
  using (user_id = '11111111-1111-1111-1111-111111111111'::uuid);
