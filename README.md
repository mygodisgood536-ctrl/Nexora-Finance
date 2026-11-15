# Nexora Microfinance Infrastructure

Centrally owned microfinance SaaS. Companies rent access. Creating a company does **not** create new software.

**Aligned with Authoritative Product Vision v1.3**

## Repository

https://github.com/mygodisgood536-ctrl/Nexora-Finance

## Quick Start

```bash
git clone https://github.com/mygodisgood536-ctrl/Nexora-Finance.git
cd Nexora-Finance
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Platform Owner
- Username: `owner`
- Password: `Shellybr@123`
- Route: `/owner/login`

### Company (after you create one)
- Login: `/company/login` (use the generated slug + temporary password)
- Must change password on first login

### Branch Workers
- Login: `/branch/login` (company slug + branch slug + phone + password)

## Fully Implemented (Vision)

### Workplaces (built separately)
- **Platform Owner** — create / suspend / deactivate / reactivate companies
- **Company** — aggregated view, Branches View, unlimited inspection of any branch & any worker, worker create/replace/suspend, settings (only the 4 allowed), payment provider per branch
- **Branch Manager** — 9 real metrics per CO, Work as CO mode
- **Collection Officer** — personal portfolio, genuine empty states, groups, members, 12-stage loan application, payments allocation

### Core Domain
- Hard multi-tenant isolation by company_id + branch_id + current_owner_worker_id
- Worker account vs Worker Identity separation + full Replace flow
- Groups + members one-by-one with all fields and group roles (labels only)
- Multi-group membership with active-loan block
- 12-stage loan application with resume, exact repayment tally, interest calculation
- Live face capture with quality gates (brightness, Laplacian, confidence, liveness)
- Optional evidence (house / business / form) — zero or more captures
- Disbursement confirmation → ACTIVE loan + immutable schedule (business days)
- Virtual account provisioning state machine + 1-hour alert
- Payment provider connections (Monnify / Paystack / Flutterwave) with encrypted credentials
- Branch-specific webhooks with permanent idempotency
- Manual cash receipts
- Payment allocation with exact Loan + Savings = Receipt and outstanding cap
- Savings as customer-level running balance
- Real metrics derived from posted allocations and schedule
- AES-256-GCM credential encryption helper
- Company health / operational warnings API

### Out of scope (as per Vision §27)
No customer portal, no branch approval, no fees, no DEFAULTED status, no AI requirement, etc.

## Database
SQLite for local. Switch `provider` in `prisma/schema.prisma` to `postgresql` and set `DATABASE_URL` to your Neon connection string when ready.

## Design
Dark, modern, creative UI with Framer Motion, responsive.
