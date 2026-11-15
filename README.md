# Nexora Microfinance Infrastructure Platform

**Version**: 1.0 (aligned with Authoritative Product Vision v1.3)

Centrally owned microfinance SaaS infrastructure. Companies rent access. No per-company software is built.

## Core Principles (from Vision)

- One platform, one identity, one set of colours
- Companies are completely isolated by `company_id`
- Workers (BM / CO) are isolated by portfolio ownership
- Creating a company does **not** create new software — only records + URL + temporary password
- No customer portal
- No branch approval stages
- Strict 12-stage loan application, immutable schedules, exact repayment tally rules

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Prisma + SQLite (dev) → Neon PostgreSQL (production)
- **Auth**: Custom JWT sessions (separate workplaces)
- **UI**: Tailwind CSS + Framer Motion (dark, modern, smooth creative design)
- **Icons**: Lucide React

## Platform Owner

- Username: `owner`
- Password: `Shellybr@123`

## Getting Started

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000 → redirects to Platform Owner login.

## Workplaces (built separately)

1. **Platform Owner** (`/owner`) — Create / Suspend / Deactivate / Reactivate companies + platform health
2. **Company** (`/company`) — Aggregated performance, Branches View, full worker inspection, provider config
3. **Branch Manager** — Branch-wide dashboard + 9 metrics + “Work as CO” mode
4. **Collection Officer** — Personal portfolio, groups, 12-stage loan application, payment allocation

## Isolation

Every query is scoped. Companies cannot see each other. Workers cannot see other workers’ portfolios (except formal replacement flow).

## Status

Foundation + Platform Owner workplace is live. Continuous development of remaining workplaces is in progress following the vision exactly.
