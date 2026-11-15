# Nexora Microfinance Infrastructure

Centrally owned microfinance SaaS platform. Companies rent access. Creating a company does **not** create new software.

**Aligned with Authoritative Product Vision v1.3**

## Platform Owner

- Username: `owner`
- Password: `Shellybr@123`

Login at `/owner/login`

## What is implemented

### Workplaces (separate)
- **Platform Owner** — create / suspend / deactivate / reactivate companies, platform health
- **Company** — aggregated view, Branches View, full unlimited inspection of any branch and any worker, worker create / replace / suspend, settings (only the four allowed options)
- **Branch Manager** — branch-wide 9 metrics table, “Work as CO” mode switch
- **Collection Officer** — personal portfolio dashboard with genuine empty states, groups, members, loan applications

### Core flows
- Company creation → auto URL + temporary password
- Branch creation → auto branch URL
- Worker create + full Replace flow (retains worker_id, new identity, portfolio transfer, history preserved)
- Group create + add members one-by-one with all required fields and group roles
- Multi-group membership rules + active-loan block
- 12-stage loan application wizard with resume, exact repayment tally validation, interest calculation
- Disbursement confirmation → immediate ACTIVE loan + immutable schedule generation
- Payment provider connection management (company side, per branch)
- Webhook receiver with permanent idempotency key
- Manual cash receipts
- Payment allocation with exact Loan + Savings = Receipt and outstanding cap
- Monetary helpers (half-up to kobo) and business-day schedule rules

### Isolation
Hard scoped by company_id / branch_id / current_owner_worker_id at every boundary.

### Tech
Next.js 15 + TypeScript + Prisma + Tailwind + Framer Motion (dark creative UI)

## Run

```bash
npm install
npx prisma db push
npm run db:seed   # optional
npm run dev
```

Then open http://localhost:3000

For production database later, set `DATABASE_URL` to your Neon PostgreSQL connection string and change the Prisma provider to `postgresql`.

## Vision rules strictly followed
No customer portal, no branch approval stage, no fees, no DEFAULTED status, savings as running balance only, original creator immutable, etc.

## Current GitHub

https://github.com/mygodisgood536-ctrl/Nexora-Finance

After clone:

```bash
npm install
npx prisma db push
npm run dev
```

Platform Owner login: username `owner` / password `Shellybr@123`
