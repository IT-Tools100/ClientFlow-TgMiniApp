-- Optional Stage 5 helper: move legacy DEMO_USER_ID CRM rows to a chosen profile.
-- Do not run this automatically. Replace the null target_profile_id with the
-- profile id created by the Stage 4 Telegram/dev identity flow, review, then run.

do $$
declare
  legacy_demo_profile_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
  target_profile_id uuid := null;
begin
  if target_profile_id is null then
    raise exception 'Set target_profile_id before running this optional migration';
  end if;

  if not exists (select 1 from public.profiles where id = target_profile_id) then
    raise exception 'Target profile % does not exist', target_profile_id;
  end if;

  update public.clients
  set user_id = target_profile_id
  where user_id = legacy_demo_profile_id;

  update public.tasks
  set user_id = target_profile_id
  where user_id = legacy_demo_profile_id;

  update public.deals
  set user_id = target_profile_id
  where user_id = legacy_demo_profile_id;

  update public.activities
  set user_id = target_profile_id
  where user_id = legacy_demo_profile_id;
end $$;
