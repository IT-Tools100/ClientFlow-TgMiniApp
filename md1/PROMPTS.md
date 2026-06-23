# PROMPTS.md

# Prompts for Codex — ClientFlow Mini App

## Prompt 1 — базовая структура и UI shell

Прочитай AGENTS.md, PROJECT_BRIEF.md, REQUIREMENTS.md, DESIGN_SYSTEM.md, ARCHITECTURE.md, DATABASE.md и TASKS.md.

Создай базовую структуру проекта ClientFlow Mini App на Next.js, TypeScript и Tailwind CSS.

Проект должен быть подготовлен как Telegram Mini App.

На первом этапе не подключай Supabase и не делай всю бизнес-логику сразу.

Сделай:

- базовую структуру проекта
- src/app
- src/components
- src/data
- src/lib
- src/types
- global styles
- Liquid Glass design foundation
- mobile-first layout
- bottom navigation
- базовые reusable components:
  - GlassCard
  - Button
  - Badge
  - Input
  - SectionHeader
  - BottomNav
- базовый Dashboard screen на mock data
- placeholder screens:
  - Clients
  - Tasks
  - Deals
  - Analytics
  - Profile

Требования:

- дизайн в стиле Liquid Glass
- интерфейс должен выглядеть как Telegram Mini App
- mobile-first
- не использовать backend на первом шаге
- не подключать Supabase на первом шаге
- код должен быть чистым и компонентным

После выполнения:

- обнови TASKS.md
- запусти typecheck
- запусти lint
- запусти build
- дай краткий отчет о выполненных изменениях

## Prompt 2 — Clients CRUD на mock data

Продолжи проект ClientFlow Mini App.

Прочитай TASKS.md, REQUIREMENTS.md и ARCHITECTURE.md.

Сделай полноценный экран Clients на mock data:

- список клиентов
- поиск по имени/контакту
- фильтр по статусу
- карточки клиентов
- открытие client profile
- форма добавления клиента
- форма редактирования клиента
- удаление клиента из локального state
- empty state

Пока не подключай Supabase.

После выполнения обнови TASKS.md и запусти проверки.

## Prompt 3 — Tasks и Deals

Продолжи ClientFlow Mini App.

Сделай экраны Tasks и Deals на mock data.

Tasks:

- список задач
- статусы Today / Upcoming / Done / Overdue
- добавление задачи
- смена статуса

Deals:

- список сделок
- сумма
- клиент
- статус
- вероятность закрытия
- pipeline summary

После выполнения обнови TASKS.md и запусти проверки.

## Prompt 4 — Analytics и polish

Продолжи ClientFlow Mini App.

Сделай экран Analytics:

- total clients
- active deals
- won deals
- pipeline value
- conversion rate
- paid clients
- weekly new clients

Проведи UI polish:

- улучшить Liquid Glass cards
- проверить mobile spacing
- добавить empty/loading/error states
- улучшить typography
- улучшить bottom navigation

После выполнения обнови TASKS.md и запусти проверки.

## Prompt 5 — Telegram integration

Продолжи ClientFlow Mini App.

Добавь безопасную интеграцию Telegram WebApp API:

- создать lib/telegram.ts
- init Telegram WebApp если объект доступен
- fallback для браузера
- получить данные Telegram user если возможно
- использовать theme params если возможно
- вызвать expand при открытии

Приложение не должно ломаться при запуске в обычном браузере.

После выполнения обнови TASKS.md и запусти проверки.

## Prompt 6 — Supabase integration

Продолжи ClientFlow Mini App.

Подключи Supabase.

Сделай:

- .env.example
- lib/supabase.ts
- типы для clients/deals/tasks
- CRUD для clients
- чтение clients из Supabase
- создание клиента
- редактирование клиента
- удаление клиента
- fallback/demo mode, если env не настроен

Не коммить .env.local.

После выполнения обнови TASKS.md и запусти проверки.

## Prompt 7 — README и GitHub подготовка

Подготовь проект ClientFlow Mini App к публикации на GitHub.

Сделай README.md по README_TEMPLATE.md.

Требования:

- описание проекта
- features
- tech stack
- screenshots section
- project structure
- local setup
- environment variables
- future improvements
- status

Удали мусорные файлы.
Проверь .gitignore.
Проверь, что .env.local не попадет в git.
Запусти typecheck, lint, build.
