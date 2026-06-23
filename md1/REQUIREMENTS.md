# REQUIREMENTS.md

# Требования к проекту ClientFlow Mini App

## Цель v1

Создать рабочий Telegram Mini App с красивой mobile-first оболочкой, mock data, базовой бизнес-логикой и дальнейшей готовностью к подключению Supabase.

## Основные экраны

### 1. Dashboard

Главный экран приложения.

Должен показывать:

- общее количество клиентов
- количество новых клиентов
- активные сделки
- сумма сделок
- задачи на сегодня
- простая конверсия
- последние активности
- быстрые действия

### 2. Clients

Экран списка клиентов.

Функции:

- список клиентов
- поиск
- фильтр по статусу
- добавление клиента
- редактирование клиента
- удаление клиента
- открытие карточки клиента

Статусы клиентов:

- New
- Contacted
- In Progress
- Waiting Payment
- Paid
- Lost

### 3. Client Profile

Экран карточки клиента.

Должен показывать:

- имя клиента
- контакт
- источник клиента
- статус
- сумма сделки
- заметки
- связанные задачи
- связанные сделки
- история активности

### 4. Tasks

Экран задач.

Функции:

- список задач
- задачи на сегодня
- будущие задачи
- выполненные задачи
- просроченные задачи
- создание задачи
- изменение статуса задачи

Статусы задач:

- Today
- Upcoming
- Done
- Overdue

### 5. Deals

Экран сделок.

Функции:

- список сделок
- сумма сделки
- статус сделки
- клиент сделки
- вероятность закрытия
- фильтрация

Статусы сделок:

- Open
- Proposal Sent
- Waiting Payment
- Won
- Lost

### 6. Analytics

Простая аналитика.

Показать:

- всего клиентов
- новых клиентов за неделю
- активных сделок
- закрытых сделок
- сумму выигранных сделок
- сумму pipeline
- конверсию

### 7. Profile / Settings

Профиль пользователя.

Показать:

- Telegram user placeholder
- theme mode
- currency
- demo mode
- app version
- project info

## Функциональные требования v1

- Mobile-first интерфейс
- Bottom navigation
- Mock data на первом этапе
- Reusable components
- Liquid Glass UI
- Dashboard cards
- CRUD UI для клиентов
- Search UI
- Filters UI
- Modal/drawer для форм
- Empty states
- Loading states
- Error states
- Responsive behavior
- README
- Screenshots folder

## Функциональные требования v2

- Supabase integration
- Real database CRUD
- Telegram user init
- User-based data isolation
- Vercel deploy
- BotFather setup

## Не входит в v1

- платежи
- сложные роли
- командная работа
- AI-функции
- email-рассылки
- сложные уведомления
- интеграция с amoCRM/Bitrix

## Критерии готовности

Проект считается готовым, если:

- приложение запускается локально
- главные экраны сверстаны
- mock data отображаются
- UI выглядит премиально
- код проходит typecheck
- код проходит lint
- проект собирается через build
- README готов для GitHub
- есть скриншоты
- структура проекта понятная
