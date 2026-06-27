# Supabase setup

This folder prepares the future database layer for ClientFlow Mini App.

## Create a Supabase project

1. Go to https://supabase.com/dashboard.
2. Create a new project.
3. Wait until the database is ready.
4. Open `SQL Editor`.

## Apply the schema

1. Open `supabase/schema.sql` in this repository.
2. Copy the full SQL file.
3. Paste it into Supabase SQL Editor.
4. Run the query.

The script creates:

- `profiles`
- `clients`
- `tasks`
- `deals`
- `activities`

It also enables Row Level Security. The current local/dev policy set expects a
Telegram/dev profile bootstrap flow and CRM rows scoped by `user_id` in the
application service layer. Final production policies should be tightened after
server-side Telegram `initData` verification is added.

## Environment variables

Add these later when the frontend starts using Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

For local development, put them in `.env.local`.

Do not commit `.env.local`.

## Future frontend connection

The next implementation step can add:

- server-side Telegram `initData` verification
- final profile ownership RLS policies
- replacement of temporary bootstrap policies
