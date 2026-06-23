# TASKS.md

# ClientFlow Mini App — Tasks

## Статус проекта

Статус: подготовка к разработке

## Этап 0 — подготовка проекта

- [ ] Создать рабочую папку проекта
- [ ] Создать Next.js проект
- [ ] Настроить TypeScript
- [ ] Настроить Tailwind CSS
- [ ] Создать базовую структуру папок
- [ ] Добавить `.gitignore`
- [ ] Добавить `.env.example`

## Этап 1 — базовая оболочка

- [ ] Создать `AppShell`
- [ ] Создать `BottomNav`
- [ ] Создать mobile-first layout
- [ ] Добавить Telegram Mini App feeling
- [ ] Создать tab navigation
- [ ] Сделать placeholder screens

## Этап 2 — UI kit / Liquid Glass

- [ ] Создать `GlassCard`
- [ ] Создать `Button`
- [ ] Создать `Badge`
- [ ] Создать `Input`
- [ ] Создать `SectionHeader`
- [ ] Создать `Modal` или `Drawer`
- [ ] Настроить glass backgrounds
- [ ] Настроить gradients/glow

## Этап 3 — mock data

- [ ] Создать типы данных
- [ ] Создать mock clients
- [ ] Создать mock deals
- [ ] Создать mock tasks
- [ ] Создать mock activities

## Этап 4 — Dashboard

- [ ] Сделать stat cards
- [ ] Сделать quick actions
- [ ] Сделать recent activity
- [ ] Сделать tasks today preview
- [ ] Сделать pipeline summary

## Этап 5 — Clients

- [ ] Сделать список клиентов
- [ ] Сделать поиск
- [ ] Сделать фильтр по статусу
- [ ] Сделать карточку клиента
- [ ] Сделать форму добавления клиента
- [ ] Сделать форму редактирования клиента
- [ ] Сделать удаление клиента на уровне UI state
- [ ] Сделать client profile view

## Этап 6 — Tasks

- [ ] Сделать список задач
- [ ] Сделать группы задач
- [ ] Сделать смену статуса
- [ ] Сделать форму добавления задачи

## Этап 7 — Deals

- [ ] Сделать список сделок
- [ ] Сделать статусы сделок
- [ ] Сделать сумму pipeline
- [ ] Сделать связь сделки с клиентом

## Этап 8 — Analytics

- [ ] Посчитать total clients
- [ ] Посчитать active deals
- [ ] Посчитать won deals
- [ ] Посчитать pipeline value
- [ ] Посчитать conversion
- [ ] Сделать analytics screen

## Этап 9 — Telegram integration

- [ ] Создать `lib/telegram.ts`
- [ ] Добавить безопасный browser fallback
- [ ] Получать Telegram user при наличии
- [ ] Читать theme params при наличии
- [ ] Добавить app expand

## Этап 10 — Supabase

- [ ] Создать Supabase project
- [ ] Создать таблицы
- [ ] Добавить `.env.local`
- [ ] Подключить Supabase client
- [ ] Заменить mock CRUD на Supabase CRUD
- [ ] Проверить создание клиента
- [ ] Проверить редактирование клиента
- [ ] Проверить удаление клиента

## Этап 11 — polish

- [ ] Проверить mobile UI
- [ ] Проверить светлую/темную тему при необходимости
- [ ] Проверить empty states
- [ ] Проверить loading states
- [ ] Проверить ошибки
- [ ] Проверить accessibility basics
- [ ] Убрать мусорные файлы

## Этап 12 — GitHub / Deploy

- [ ] Создать README
- [ ] Добавить screenshots
- [ ] Создать GitHub repo
- [ ] Сделать первый commit
- [ ] Push на GitHub
- [ ] Деплой на Vercel
- [ ] Настроить BotFather Web App URL

## Проверки

Перед каждым commit:

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm build`
