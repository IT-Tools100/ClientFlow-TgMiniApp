-- Stage 5 profile ownership RLS for the current Telegram/dev identity foundation.
-- This removes CRM DEMO_USER_ID policies. It is a dev/stage policy set, not final
-- production security, because Telegram initData is not server-verified yet.

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Demo profile can be read" on public.profiles;
drop policy if exists "Demo profile can be inserted" on public.profiles;
drop policy if exists "Demo profile can be updated" on public.profiles;
drop policy if exists "Telegram profiles can be read during bootstrap" on public.profiles;
drop policy if exists "Telegram profiles can be inserted during bootstrap" on public.profiles;
drop policy if exists "Telegram profiles can be updated during bootstrap" on public.profiles;

drop policy if exists "Demo clients can be read" on public.clients;
drop policy if exists "Demo clients can be inserted" on public.clients;
drop policy if exists "Demo clients can be updated" on public.clients;
drop policy if exists "Demo clients can be deleted" on public.clients;
drop policy if exists "Profile-owned clients can be read" on public.clients;
drop policy if exists "Profile-owned clients can be inserted" on public.clients;
drop policy if exists "Profile-owned clients can be updated" on public.clients;
drop policy if exists "Profile-owned clients can be deleted" on public.clients;

drop policy if exists "Demo tasks can be read" on public.tasks;
drop policy if exists "Demo tasks can be inserted" on public.tasks;
drop policy if exists "Demo tasks can be updated" on public.tasks;
drop policy if exists "Demo tasks can be deleted" on public.tasks;
drop policy if exists "Profile-owned tasks can be read" on public.tasks;
drop policy if exists "Profile-owned tasks can be inserted" on public.tasks;
drop policy if exists "Profile-owned tasks can be updated" on public.tasks;
drop policy if exists "Profile-owned tasks can be deleted" on public.tasks;

drop policy if exists "Demo deals can be read" on public.deals;
drop policy if exists "Demo deals can be inserted" on public.deals;
drop policy if exists "Demo deals can be updated" on public.deals;
drop policy if exists "Demo deals can be deleted" on public.deals;
drop policy if exists "Profile-owned deals can be read" on public.deals;
drop policy if exists "Profile-owned deals can be inserted" on public.deals;
drop policy if exists "Profile-owned deals can be updated" on public.deals;
drop policy if exists "Profile-owned deals can be deleted" on public.deals;

drop policy if exists "Demo activities can be read" on public.activities;
drop policy if exists "Demo activities can be inserted" on public.activities;
drop policy if exists "Demo activities can be updated" on public.activities;
drop policy if exists "Demo activities can be deleted" on public.activities;
drop policy if exists "Profile-owned activities can be read" on public.activities;
drop policy if exists "Profile-owned activities can be inserted" on public.activities;
drop policy if exists "Profile-owned activities can be updated" on public.activities;
drop policy if exists "Profile-owned activities can be deleted" on public.activities;

create policy "Telegram profiles can be read during bootstrap"
  on public.profiles
  for select
  to anon, authenticated
  using (telegram_id is not null);

create policy "Telegram profiles can be inserted during bootstrap"
  on public.profiles
  for insert
  to anon, authenticated
  with check (telegram_id is not null);

create policy "Telegram profiles can be updated during bootstrap"
  on public.profiles
  for update
  to anon, authenticated
  using (telegram_id is not null)
  with check (telegram_id is not null);

create policy "Profile-owned clients can be read"
  on public.clients
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = clients.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned clients can be inserted"
  on public.clients
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = clients.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned clients can be updated"
  on public.clients
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = clients.user_id
        and profiles.telegram_id is not null
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = clients.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned clients can be deleted"
  on public.clients
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = clients.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned tasks can be read"
  on public.tasks
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = tasks.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned tasks can be inserted"
  on public.tasks
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = tasks.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = tasks.client_id
          and clients.user_id = tasks.user_id
      )
    )
  );

create policy "Profile-owned tasks can be updated"
  on public.tasks
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = tasks.user_id
        and profiles.telegram_id is not null
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = tasks.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = tasks.client_id
          and clients.user_id = tasks.user_id
      )
    )
  );

create policy "Profile-owned tasks can be deleted"
  on public.tasks
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = tasks.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned deals can be read"
  on public.deals
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = deals.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned deals can be inserted"
  on public.deals
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = deals.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = deals.client_id
          and clients.user_id = deals.user_id
      )
    )
  );

create policy "Profile-owned deals can be updated"
  on public.deals
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = deals.user_id
        and profiles.telegram_id is not null
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = deals.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = deals.client_id
          and clients.user_id = deals.user_id
      )
    )
  );

create policy "Profile-owned deals can be deleted"
  on public.deals
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = deals.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned activities can be read"
  on public.activities
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = activities.user_id
        and profiles.telegram_id is not null
    )
  );

create policy "Profile-owned activities can be inserted"
  on public.activities
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = activities.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = activities.client_id
          and clients.user_id = activities.user_id
      )
    )
  );

create policy "Profile-owned activities can be updated"
  on public.activities
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = activities.user_id
        and profiles.telegram_id is not null
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = activities.user_id
        and profiles.telegram_id is not null
    )
    and (
      client_id is null
      or exists (
        select 1
        from public.clients
        where clients.id = activities.client_id
          and clients.user_id = activities.user_id
      )
    )
  );

create policy "Profile-owned activities can be deleted"
  on public.activities
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = activities.user_id
        and profiles.telegram_id is not null
    )
  );
