# README_TEMPLATE.md

# ClientFlow Mini App

A mobile-first Telegram Mini App concept for managing clients, tasks, and deals in a compact business workspace.

## About

ClientFlow is a portfolio project built to demonstrate a Telegram Mini App interface with real business logic: client tracking, task management, deal pipeline, dashboard metrics, and Supabase-ready architecture.

The project is designed for freelancers, small studios, service businesses, and Telegram-first workflows.

## Features

- Telegram Mini App shell
- Liquid Glass mobile UI
- Dashboard with useful business metrics
- Client list and client profile
- Client statuses
- Tasks management
- Deals pipeline
- Search and filters
- Analytics overview
- Supabase-ready structure
- Mobile-first responsive layout

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Telegram WebApp API
- Vercel

## Screenshots

Add screenshots here:

```md
![Dashboard](./public/screenshots/dashboard.png)
![Clients](./public/screenshots/clients.png)
![Client Profile](./public/screenshots/client-profile.png)
```

## Project Structure

```text
src/
├── app/
├── components/
├── data/
├── lib/
└── types/
```

## Local Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

Create `.env.local` based on `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```

## Future Improvements

- Full Supabase CRUD
- Telegram user-based data isolation
- Role-based access
- Notifications
- Team collaboration
- AI follow-up suggestions
- Payment integration

## Status

Portfolio concept / in development.
