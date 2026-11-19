# NEXORA

**Intelligent Infrastructure for Financial Growth.**

Centrally owned microfinance SaaS. Companies rent access. Creating a company does not rebuild software.

## Architecture

| Environment | How it appears | Access |
|---|---|---|
| Infrastructure Owner | Main URL only | `/` → `/owner/login` |
| Company (prebuilt) | Provisioned on create | `/c/{slug}` |
| Branch (prebuilt) | Provisioned when company creates branch | Branch staff login |
| BM / CO (prebuilt) | Provisioned when workers are created | Role-based branch workspace |

Prebuilt ≠ publicly listed. Environments exist in code and activate when records are created.

## Local setup

```bash
npm install
# Set DATABASE_URL to your Neon PostgreSQL connection string
npx prisma db push
npm run db:seed
npm run dev
```

Infrastructure Owner:
- Username: `owner`
- Password: `Shellybr@123`

## Production (Vercel + Neon)

1. Set `DATABASE_URL` (and optionally `DIRECT_URL`) in Vercel env for the Nexora project.
2. Set `NEXORA_JWT_SECRET`, `NEXORA_OWNER_USERNAME`, `NEXORA_OWNER_PASSWORD`.
3. Set `NEXT_PUBLIC_APP_URL` to the deployment URL.
4. Build uses `vercel-build`: generate Prisma client, push schema, build Next.js.

## Brand

- Name: **NEXORA**
- Tagline: **Intelligent Infrastructure for Financial Growth.**
