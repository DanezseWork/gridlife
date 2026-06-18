# Gridlife API

NestJS REST API for [Gridlife](../README.md) — habits, tasks, wallets, and planned transactions.

## Quick start

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api/docs

Requires Postgres (see root `docker compose up -d`).

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret (required) |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`) |
| `PORT` | HTTP port (default `3000`) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:3001`) |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Dev server with watch |
| `npm run start:prod` | Production server |
| `npm run prisma:migrate` | Run Prisma migrations (local dev) |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Seed demo user + sample data |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint |

## Modules

| Path | Purpose |
|------|---------|
| `/auth` | Login |
| `/me` | Current user profile |
| `/habits` | Habit CRUD, reorder, toggle logs |
| `/tasks` | Daily tasks, calendar, subtasks |
| `/wallets` | Wallet CRUD + computed balances |
| `/transactions` | Transaction list + create |
| `/planned-transactions` | Scheduled/recurring plans, queue, projection |
| `/settings` | Theme and currency preferences |

All routes except `POST /auth/login` require `Authorization: Bearer <token>`.

See the [root README](../README.md) for architecture, data model, and deployment.
