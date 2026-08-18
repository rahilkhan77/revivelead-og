# ReviveLead

Revenue recovery platform for real estate agencies in Dubai, Qatar, Mumbai and Bangalore.

**Turn Lost Leads Into Revenue.**

AI qualifies and drafts follow-ups. The product is the recovery loop: capture, follow up, reactivate, and book recovered revenue. It is not an AI chatbot.

The Next.js application lives in [`frontend/`](frontend/). API routes, server actions, Prisma, Clerk, the chatbot, cron, and webhooks stay inside that app so Vercel can deploy it with **Root Directory = `frontend`**.

## Local setup

```bash
cd frontend
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

The canonical env template is `frontend/.env.example`. Copy it into `frontend/.env` (or `.env.local`). Never commit secrets.

From the repo root you can also run `npm run dev` (it forwards into `frontend/`).

Local database is SQLite (`DATABASE_URL="file:./dev.db"`). Production must use PostgreSQL.

Local demo (Al Noor Properties, Dubai) — not shown on the production landing page:

- Owner: `owner@alnoor.ae` / `Demo1234!`
- Manager: `fatima@alnoor.ae` / `Demo1234!`
- Agent: `omar@alnoor.ae` / `Demo1234!`

New agencies sign up (Clerk when configured) and complete `/onboarding`. They are never placed in the Al Noor demo organization.

## Scripts

Run these from `frontend/` (or via the root wrappers):

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run db:seed
npm run db:prod:migrate
```

## Vercel

- Root Directory: `frontend`
- Build command: `npm run build`
- Do not deploy until production env vars are set in the Vercel dashboard.

See [docs/PRODUCTION.md](docs/PRODUCTION.md) for:

- Environment variables
- Supabase PostgreSQL (Prisma only — not Supabase Auth)
- Clerk
- Meta WhatsApp Cloud API
- OpenAI / optional Puter (`LLM_PROVIDER`)
- Resend
- Razorpay checkout and webhooks
- n8n / API keys
- Cron / follow-up worker
- First-client onboarding
- Deployment
