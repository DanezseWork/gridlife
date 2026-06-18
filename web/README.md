# Gridlife Web

Next.js frontend for [Gridlife](../README.md) — habits, tasks, finance, and settings.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

App: http://localhost:3001 (API expected at http://localhost:3000).

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default `http://localhost:3000`) |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |

## Routes

| Route | Page |
|-------|------|
| `/login` | Sign in |
| `/habits` | Habit tracking (default) |
| `/tasks` | Daily tasks + calendar |
| `/finance` | Wallets, transactions, charts |
| `/settings` | Theme + logout |

See the [root README](../README.md) for features, design system, and deployment.
