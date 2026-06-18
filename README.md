# Gridlife

Mobile-first habit tracker and personal finance app with a clean, accent-driven UI. Built as a monorepo with a NestJS REST API and a Next.js frontend.

## Scope

Gridlife is a **personal productivity dashboard** — one user, one account, habits + daily tasks + wallets in a single place. It is intentionally:

- **Mobile-first** — bottom tab bar on phones, sidebar on desktop, safe-area aware
- **Single-user** — no sign-up flow; accounts are seeded or inserted directly
- **Self-hosted friendly** — Postgres + API + static/SSR web, deployable to Railway + Vercel

Out of scope for now: multi-tenant accounts, public registration, native mobile apps, and shared/collaborative data.

## Features

### Habits

- Create, edit, soft-delete (archive), and drag-and-drop reorder habits
- Flexible schedules: daily, weekly, monthly, yearly, or custom interval
- Multi-count targets (e.g. drink water 8× per day) with tap-to-increment
- GitHub-style contribution grid with responsive history (8–52 weeks by viewport)
- Streak tracking and per-habit calendar history dialog
- Toggle today’s completion from the habits page or via linked tasks
- Custom color and icon per habit (100 Lucide-style icons)

Archived habits are hidden from the list; there is no restore UI yet.

### Tasks

- Daily task list scoped to a selected date
- Month calendar heatmap showing completion per day
- Standalone tasks with title, details, and subtasks
- Create, edit, delete, and drag-and-drop reorder (incomplete tasks only)
- Habit-linked tasks auto-generated from habit schedules
- Past dates are read-only; habit tasks can only be toggled on today
- Parent tasks require all subtasks complete before marking done

### Finance

- Multiple wallets with per-wallet currency, color, and icon (18 currencies, 10 wallet icons)
- Income, expense, and transfer transactions with full transaction history
- Create, edit, and delete wallets
- Computed wallet balances (SQL aggregation on the API)
- Network totals: split-by-currency or combined view with live FX conversion ([open.er-api.com](https://open.er-api.com))
- Historical balance chart and projected balance chart from planned transactions
- Planned transactions:
  - **Scheduled** — one-off future date
  - **Recurring** — weekly, monthly, or yearly with flexible schedule days
- Upcoming queue view; deactivate plans from the UI; due plans auto-materialize into real transactions on read
- Balance projection API (`week` / `month` / `year` ranges)
- Overdraft confirmation when expenses exceed wallet balance

### Settings & theming

- Customizable base and accent colors (presets + custom hex)
- Theme preview on the login page; persisted locally and synced to the API on change
- Logout

> **Note:** The API stores a default `currency` on `UserSettings`, but the Settings UI does not expose it yet. Finance views pick a display currency per session from your wallet currencies.

### Authentication

- Email/password login with JWT (7-day expiry by default)
- Demo account pre-seeded for local development
- Client-side route protection (`AuthGuard`); token stored in `localStorage`

## Tech stack

| Layer | Stack |
|-------|-------|
| **API** | NestJS 11, Prisma 6, PostgreSQL, Passport JWT, class-validator, Swagger |
| **Web** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, Framer Motion, `@dnd-kit` |
| **Infra** | Docker Compose (Postgres 16 + Adminer) |

## Architecture

```
/gridlife
  /api          ← NestJS REST API (port 3000)
  /web          ← Next.js frontend (port 3001)
  docker-compose.yml
```

### Web routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/habits` |
| `/login` | Sign in + theme preview |
| `/habits` | Habit tracking (default landing) |
| `/tasks` | Daily tasks + calendar |
| `/finance` | Wallets, transactions, charts, planned queue |
| `/settings` | Theme + logout |

Mobile uses a fixed bottom tab bar; desktop uses a sticky sidebar. Safe-area insets are respected for notched devices.

### API modules

All routes except `POST /auth/login` require `Authorization: Bearer <token>`. Responses are wrapped as `{ data, timestamp }`.

| Module | Base path | Highlights |
|--------|-----------|------------|
| Auth | `/auth` | Login |
| Users | `/me` | Profile (includes settings snapshot) |
| Habits | `/habits` | CRUD, reorder, toggle logs |
| Tasks | `/tasks` | Daily list, calendar, subtasks, reorder, delete |
| Wallets | `/wallets` | CRUD, computed balances |
| Transactions | `/transactions` | List + create income/expense/transfer |
| Planned transactions | `/planned-transactions` | Queue, projection, scheduled/recurring, deactivate |
| Settings | `/settings` | Update theme colors and default currency |

Interactive API docs: http://localhost:3000/api/docs

### Data model

PostgreSQL via Prisma. Core entities:

- **User** — root account; cascades to all owned data
- **Habit** + **HabitLog** — habits and daily completion counts (`archivedAt` for soft delete)
- **Task** + **Subtask** — daily tasks (optionally linked to a habit)
- **Wallet** + **Transaction** — accounts and ledger entries
- **PlannedTransaction** + **PlannedOccurrence** — scheduled/recurring rules and materialized occurrences
- **UserSettings** — base color, accent color, default currency (API only for currency today)

There is no public registration endpoint; users are created via seed or direct database insert.

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for Postgres)

### 1. Database

```bash
docker compose up -d
```

Postgres runs on **port 5433** (mapped to avoid conflicts with a local Postgres install).

Adminer (DB UI): http://localhost:8080

### 2. API

```bash
cd api
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

### 3. Web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Web: http://localhost:3001

### Demo login

| Field | Value |
|-------|-------|
| Email | `demo@gridlife.app` |
| Password | `password123` |

Re-running `npm run prisma:seed` deletes and recreates the demo user with sample habits, wallets, transactions, and planned rules (no sample tasks).

## Environment variables

### API (`api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5433/gridlife` | PostgreSQL connection string |
| `JWT_SECRET` | — | JWT signing secret (required) |
| `JWT_EXPIRES_IN` | `7d` | Token expiry |
| `PORT` | `3000` | HTTP listen port |
| `CORS_ORIGIN` | `http://localhost:3001` | Allowed frontend origin |

### Web (`web/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Backend API base URL |

## Development scripts

### API (`cd api`)

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run start:prod` | Production (`node dist/main`) |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:seed` | Seed demo data |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |

### Web (`cd web`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## Design

Gridlife uses a minimal, mobile-first interface with a customizable accent theme:

- **Typography:** Space Grotesk (headings), JetBrains Mono (data/numbers)
- **Core surfaces:** soft borders, accent glow on focus, responsive touch targets
- **Accent panels:** holo-card hover grid and HUD corner brackets on login and finance wallet cards; habits and tasks stay cleaner and card-based
- **Theming:** CSS variables via Zustand; white or black base plus accent presets (cyan, magenta, green, etc.)
- **Components:** shadcn/ui (base-nova)

## Deploy

| Service | Target | Root directory |
|---------|--------|----------------|
| API + Postgres | Railway | `api` |
| Web | Vercel | `web` |

### Railway (API)

1. Create a Railway project and add a **PostgreSQL** plugin.
2. Add a service from this repo with **Root Directory** set to `api`.
3. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | From the Railway Postgres plugin (use as provided; add `?sslmode=require` if needed) |
   | `JWT_SECRET` | Strong random secret (required) |
   | `CORS_ORIGIN` | Your Vercel production URL (e.g. `https://gridlife.vercel.app`) |
   | `JWT_EXPIRES_IN` | Optional (default `7d`) |

4. Deploy. `api/railway.toml` runs migrations before each deploy (`prisma migrate deploy`) and health-checks `GET /health`.
5. Create a production user — there is no sign-up endpoint. Run `npm run prisma:seed` once from Railway shell, or insert a user directly in Postgres.

### Vercel (Web)

1. Import the repo and set **Root Directory** to `web`.
2. Set environment variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Your Railway API URL (e.g. `https://your-api.up.railway.app`) |

   `NEXT_PUBLIC_*` vars are baked in at build time — set them for Production (and Preview if you use preview deploys).

3. Deploy. Ensure Railway `CORS_ORIGIN` matches the Vercel URL you use.

### Production scripts (API)

| Script | Purpose |
|--------|---------|
| `postinstall` | Regenerates Prisma Client after `npm install` |
| `prisma:migrate:deploy` | Applies committed migrations (used by Railway pre-deploy) |
