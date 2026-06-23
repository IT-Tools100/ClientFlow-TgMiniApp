# ARCHITECTURE.md

# Архитектура ClientFlow Mini App

## Общая архитектура

Проект строится как frontend-first Telegram Mini App на Next.js.

На первом этапе приложение работает на mock data.
На втором этапе подключается Supabase.

## Стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Telegram WebApp API
- Vercel

## Рекомендуемая структура

```text
clientflow-mini-app/
├── public/
│   └── screenshots/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── SectionHeader.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── clients/
│   │   │   ├── ClientCard.tsx
│   │   │   ├── ClientForm.tsx
│   │   │   ├── ClientList.tsx
│   │   │   └── ClientProfile.tsx
│   │   ├── tasks/
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskList.tsx
│   │   └── deals/
│   │       ├── DealCard.tsx
│   │       └── DealList.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── telegram.ts
│   │   └── utils.ts
│   └── types/
│       └── index.ts
├── .env.example
├── package.json
├── README.md
└── TASKS.md
```

## UI flow

```text
AppShell
↓
BottomNav
↓
Current Screen
↓
Reusable Cards / Forms / Lists
```

## State management v1

На первом этапе можно использовать React state:

- active tab
- selected client
- search query
- status filter
- modal open/close
- local mock data changes

Не подключать сложные state managers.

## Data flow v1

```text
mockData.ts
↓
page.tsx / screens
↓
components
```

## Data flow v2

```text
Supabase
↓
server/client helpers
↓
React components
↓
UI
```

## Telegram integration

Создать `lib/telegram.ts`.

Минимальные функции:

- initTelegramApp()
- getTelegramUser()
- getThemeParams()
- expandApp()
- closeApp()

В v1 можно сделать безопасные fallback-заглушки, чтобы приложение работало и в браузере.

## Важные требования

- Все типы должны быть в `src/types/index.ts`
- Все mock data должны быть в `src/data/mockData.ts`
- Компоненты должны быть переиспользуемыми
- Нельзя хранить всю верстку в одном `page.tsx`
- `page.tsx` должен быть чистым entry point
