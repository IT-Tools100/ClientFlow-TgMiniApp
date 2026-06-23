create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  telegram_id text,
  username text,
  first_name text,
  last_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  contact text,
  source text,
  status text not null default 'New',
  value numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status text not null default 'Today',
  priority text not null default 'Medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  amount numeric not null default 0,
  status text not null default 'New',
  probability integer not null default 0 check (probability >= 0 and probability <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_telegram_id_idx on public.profiles (telegram_id);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_status_idx on public.clients (status);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_client_id_idx on public.tasks (client_id);
create index if not exists tasks_status_idx on public.tasks (status);

create index if not exists deals_user_id_idx on public.deals (user_id);
create index if not exists deals_client_id_idx on public.deals (client_id);
create index if not exists deals_status_idx on public.deals (status);

create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_client_id_idx on public.activities (client_id);
create index if not exists activities_type_idx on public.activities (type);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can delete own profile" on public.profiles;

drop policy if exists "Users can read own clients" on public.clients;
drop policy if exists "Users can insert own clients" on public.clients;
drop policy if exists "Users can update own clients" on public.clients;
drop policy if exists "Users can delete own clients" on public.clients;

drop policy if exists "Users can read own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;

drop policy if exists "Users can read own deals" on public.deals;
drop policy if exists "Users can insert own deals" on public.deals;
drop policy if exists "Users can update own deals" on public.deals;
drop policy if exists "Users can delete own deals" on public.deals;

drop policy if exists "Users can read own activities" on public.activities;
drop policy if exists "Users can insert own activities" on public.activities;
drop policy if exists "Users can update own activities" on public.activities;
drop policy if exists "Users can delete own activities" on public.activities;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = id)
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = id);

create policy "Users can delete own profile"
  on public.profiles
  for delete
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = id);

create policy "Users can read own clients"
  on public.clients
  for select
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can insert own clients"
  on public.clients
  for insert
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can update own clients"
  on public.clients
  for update
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id)
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can delete own clients"
  on public.clients
  for delete
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can read own tasks"
  on public.tasks
  for select
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can insert own tasks"
  on public.tasks
  for insert
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can update own tasks"
  on public.tasks
  for update
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id)
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can delete own tasks"
  on public.tasks
  for delete
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can read own deals"
  on public.deals
  for select
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can insert own deals"
  on public.deals
  for insert
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can update own deals"
  on public.deals
  for update
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id)
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can delete own deals"
  on public.deals
  for delete
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can read own activities"
  on public.activities
  for select
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can insert own activities"
  on public.activities
  for insert
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can update own activities"
  on public.activities
  for update
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id)
  with check (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);

create policy "Users can delete own activities"
  on public.activities
  for delete
  using (coalesce(auth.uid(), '11111111-1111-1111-1111-111111111111'::uuid) = user_id);
