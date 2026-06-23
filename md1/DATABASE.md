# DATABASE.md

# База данных ClientFlow

## Подход

В v1 приложение работает на mock data.

В v2 подключается Supabase.

Supabase нужен, чтобы показать:

- настоящую базу данных
- CRUD
- хранение клиентов
- хранение задач
- хранение сделок
- связь данных с пользователем Telegram

## Таблицы

Минимальные таблицы:

- users
- clients
- deals
- tasks
- activities

## users

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  telegram_id text unique,
  username text,
  first_name text,
  last_name text,
  created_at timestamp with time zone default now()
);
```

## clients

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  contact text,
  source text,
  status text not null default 'New',
  value numeric default 0,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## deals

```sql
create table deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  amount numeric default 0,
  status text not null default 'Open',
  probability integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## tasks

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'Today',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## activities

```sql
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  client_id uuid references clients(id) on delete cascade,
  type text not null,
  description text not null,
  created_at timestamp with time zone default now()
);
```

## Row Level Security

В production нужно включить RLS.

Для портфолио v1/v2 можно описать это в README как future improvement или базово настроить user_id isolation.

## .env.example

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```

## Важное ограничение

Не хранить приватные ключи в GitHub.

Не коммитить `.env.local`.
