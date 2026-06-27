-- Stage 4 Telegram identity foundation.
-- Run this after Stage 3 demo RLS. It does not change CRM ownership yet.

alter table public.profiles
  add column if not exists language_code text,
  add column if not exists photo_url text,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop index if exists public.profiles_telegram_id_idx;
create unique index if not exists profiles_telegram_id_unique_idx
  on public.profiles (telegram_id)
  where telegram_id is not null;

drop policy if exists "Demo profile can be read" on public.profiles;
drop policy if exists "Demo profile can be inserted" on public.profiles;
drop policy if exists "Demo profile can be updated" on public.profiles;
drop policy if exists "Telegram profiles can be read during bootstrap" on public.profiles;
drop policy if exists "Telegram profiles can be inserted during bootstrap" on public.profiles;
drop policy if exists "Telegram profiles can be updated during bootstrap" on public.profiles;

create policy "Telegram profiles can be read during bootstrap"
  on public.profiles
  for select
  to anon, authenticated
  using (
    id = '11111111-1111-1111-1111-111111111111'::uuid
    or telegram_id is not null
  );

create policy "Telegram profiles can be inserted during bootstrap"
  on public.profiles
  for insert
  to anon, authenticated
  with check (
    id = '11111111-1111-1111-1111-111111111111'::uuid
    or telegram_id is not null
  );

create policy "Telegram profiles can be updated during bootstrap"
  on public.profiles
  for update
  to anon, authenticated
  using (
    id = '11111111-1111-1111-1111-111111111111'::uuid
    or telegram_id is not null
  )
  with check (
    id = '11111111-1111-1111-1111-111111111111'::uuid
    or telegram_id is not null
  );
