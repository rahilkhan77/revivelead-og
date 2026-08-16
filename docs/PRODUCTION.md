# ReviveLead production guide

ReviveLead is a revenue recovery platform for real estate agencies. Local development stays on SQLite. Production must use PostgreSQL. Billing uses Paddle as Merchant of Record. Do not use Stripe.

## Local setup

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Local demo login (Al Noor Properties): `owner@alnoor.ae` / `Demo1234!`

These credentials are not shown on the production landing page.

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

## Environment variables

Copy `.env.example`. Never commit `.env` or real credentials.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite `file:./dev.db` locally. PostgreSQL URL in production. |
| `AUTH_SECRET` | Yes | Long random string. `openssl rand -base64 32`. |
| `AUTH_URL` | Yes | Public site URL, e.g. `https://app.revivelead.com`. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Same public URL. Used for checkout return links and emails. |
| `NEXTAUTH_URL` | Recommended | Same as `AUTH_URL` when Auth.js fallback is used. |
| `CRON_SECRET` | Yes in production | Bearer token for `GET /api/cron/follow-ups`. The app fails closed if this is missing in production. |
| `OPENAI_API_KEY` | No | Server-side only. If empty (and Puter is not selected), qualification uses the heuristic provider. AI failure never blocks lead ingestion. |
| `OPENAI_BASE_URL` | No | Defaults to `https://api.openai.com/v1`, or Puter's OpenAI-compatible URL when `LLM_PROVIDER=puter`. |
| `OPENAI_MODEL` | No | Must be a model the selected provider actually serves. Do not assume every OpenAI model exists on Puter. |
| `LLM_PROVIDER` | No | `openai`, `puter`, or `heuristic`. Switch providers without code changes. |
| `PUTER_API_KEY` | No | Server-side Puter token. Used when `LLM_PROVIDER=puter`. Never expose to the browser. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Production | Clerk is the production auth layer. App roles stay in Membership. |
| `RESEND_API_KEY` / `EMAIL_FROM` | No locally | Invites, welcome, resets, and failure alerts. Default from-address can stay `onboarding@resend.dev` until a custom domain is verified. |
| `PADDLE_API_KEY` | No locally | Server-side Paddle Billing API key. |
| `PADDLE_CLIENT_TOKEN` | No locally | Paddle.js client token for overlay checkout. |
| `PADDLE_WEBHOOK_SECRET` | No locally | Notification destination secret (`pdl_ntfset_...`). |
| `PADDLE_ENVIRONMENT` | No | `sandbox` or `production`. |
| `PADDLE_PRICE_STARTER` / `PADDLE_PRICE_PRO` / `PADDLE_PRICE_ENTERPRISE` | For checkout | Paddle price IDs (`pri_...`). |

WhatsApp tokens, SMTP passwords, and webhook secrets are **not** global env vars. Store them per organization in Settings → Integrations.

The process refuses to start in production if `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, or `CRON_SECRET` is missing.

Never expose secrets to the client. Saved WhatsApp tokens are masked after save.

## PostgreSQL setup (Supabase)

ReviveLead uses Prisma → PostgreSQL. In production the Postgres host is **Supabase**. Do not use Supabase Auth. Do not add the Supabase JS client. Clerk remains the only production authentication provider.

1. Keep `provider = "sqlite"` and `DATABASE_URL="file:./dev.db"` on your laptop.
2. In the Supabase project, copy the **Postgres connection string** (direct or session pooler on port `5432`). URL-encode special characters in the password.
3. Set production `DATABASE_URL` on the host (Vercel or similar). Do **not** point local `DATABASE_URL` at Supabase or local `npm run dev` will stop using SQLite.

Direct `db.PROJECT_REF.supabase.co` is IPv6-only. On IPv4 networks (including many Windows laptops) use the **session pooler** (port `5432`) with username `postgres.PROJECT_REF`:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

4. Apply the committed PostgreSQL schema. Prefer the session/direct URL for migrations (avoid transaction-mode port `6543` unless you also set a `DIRECT_URL`):

```bash
npm run db:prod:schema
npx prisma migrate deploy --schema prisma/postgres/schema.prisma
npx prisma generate
```

`npm run build` calls `scripts/prepare-prisma.mjs`, which switches the Prisma provider to `postgresql` when `DATABASE_URL` starts with `postgres`. Local SQLite is left alone.

Do **not** run `npm run db:seed` in production unless you explicitly set `ALLOW_DEMO_SEED=yes`. New Dubai clients must never land in Al Noor Properties.

Prisma models, indexes, foreign keys, unique constraints, enums, timestamps, JSON-as-text settings, and `onDelete: Cascade` are the same on both engines. SQLite stores enums as strings; PostgreSQL uses native enums. Every query stays `organizationId`-scoped.

## Deployment

1. Provision PostgreSQL and set the production environment variables on Vercel (or your host).
2. Set webhook URLs to HTTPS:
   - WhatsApp: `https://YOUR_DOMAIN/api/webhooks/inbound`
   - Paddle: `https://YOUR_DOMAIN/api/webhooks/paddle`
3. Run `npx prisma migrate deploy --schema prisma/postgres/schema.prisma` against production Postgres **before** the first request.
4. Deploy with `npm run build`.
5. Do not seed Al Noor unless you explicitly asked for the demo tenant.
6. Cron is configured in `vercel.json` every 10 minutes:

```
GET /api/cron/follow-ups
Authorization: Bearer $CRON_SECRET
```

Vercel Cron sends `CRON_SECRET` as that bearer token when the env var is set. You can also call the same URL every 5–15 minutes from an external scheduler.

The follow-up worker claims jobs with a `PROCESSING` status so the same item is not sent twice.

## Clerk setup

1. Create a Clerk application.
2. Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`.
4. Clerk authenticates the person. ReviveLead still creates `User`, `Organization`, and `OWNER` membership for a **new** organization (never Al Noor).
5. A welcome email is sent through Resend when configured.

Without Clerk keys, the existing Auth.js demo login keeps working locally.

## Meta WhatsApp Cloud API

1. Create a Meta app with WhatsApp Cloud API.
2. Copy the **Phone number ID**, **WhatsApp Business Account ID**, and a permanent **access token**.
3. In ReviveLead: Settings → Integrations → WhatsApp Business.
4. Enable it and save Phone Number ID, Business Account ID, Access Token, From number, and Webhook secret.
5. In Meta, set the callback URL to `https://YOUR_DOMAIN/api/webhooks/inbound`.
6. Set the verify token to the same webhook secret saved in ReviveLead.
7. Subscribe to `messages`.
8. Click **Send test message** only after explicit confirmation.

Status in Settings: `CONNECTED`, `DISCONNECTED`, or `ERROR`.

Webhook rules:

- `GET /api/webhooks/inbound` answers Meta’s `hub.challenge`.
- `POST /api/webhooks/inbound` accepts Meta payloads and custom JSON used by n8n.
- The webhook never trusts `organizationId` from the body.
- Organization is resolved from `phone_number_id` or the shared secret.
- Duplicate Meta message IDs are ignored.
- `STOP` / `UNSUBSCRIBE` marks the lead opted out and cancels pending follow-ups.

## OpenAI and Puter

The existing `LlmProvider` stays in place. Qualification, scoring assistance, conversation analysis, follow-up copy, reactivation, the website chatbot, property requirement extraction, and agent recommendations all go through `getLlmProvider()`. The browser never calls OpenAI or Puter.

```
LLM_PROVIDER=openai
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

```
LLM_PROVIDER=puter
PUTER_API_KEY=
OPENAI_BASE_URL=https://api.puter.com/puterai/openai/v1
OPENAI_MODEL=gpt-5.4-nano
```

Puter is optional. Use a Puter-supported model — do not assume every OpenAI model is available there. If the selected provider has no key, or a call fails, ReviveLead uses the heuristic fallback. Lead import and ingestion continue. The chatbot returns a safe reply and invents no listings.

## Website chatbot

```html
<script src="https://YOUR_DOMAIN/widget.js" data-widget-key="wl_..."></script>
```

The widget key is public and only maps to an organization. Chat calls `POST /api/chat`. The browser never calls OpenAI. Property search uses the same organization `Property` table and never invents listings.

## Resend

1. Create a Resend API key. Until a custom domain is verified, `EMAIL_FROM=onboarding@resend.dev` can send only to the Resend account owner.
2. Set `RESEND_API_KEY` and `EMAIL_FROM`.
3. Used for team invitations, welcome email, password/account notifications, follow-up failures, and automation failures.
4. Production does not log invitation or recovery URLs or the API key.

## Paddle setup

Paddle replaces Stripe completely. Business logic talks to `PaymentProvider`; `PaddlePaymentProvider` is the current implementation.

1. Create a Paddle sandbox (then live) account.
2. Create STARTER ($199/month) and PRO ($499/month) recurring prices. Enterprise can stay custom.
3. Set `PADDLE_API_KEY`, `PADDLE_CLIENT_TOKEN`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENVIRONMENT`, and `PADDLE_PRICE_*`.
4. Add a default payment link in Paddle Checkout settings if you want hosted `checkout.url` redirects. Overlay checkout uses Paddle.js + `transactionId` when the client token is set.
5. Notification destination: `https://YOUR_DOMAIN/api/webhooks/paddle`
6. Subscribe at least to:
   - `subscription.created`
   - `subscription.activated`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.past_due`
   - `transaction.completed`
   - `transaction.payment_failed`
7. The webhook verifies `Paddle-Signature` with `paddle.webhooks.unmarshal`.
8. Subscription state is authoritative from Paddle. The frontend is never trusted.
9. The Al Noor demo organization is never charged.

## n8n / API setup

1. Settings → Developer → Generate API key. Copy it once. It is hashed at rest and never shown again.
2. Send `x-api-key: rl_...` to:
   - `POST /api/ingest/leads`
   - `POST /api/ingest/website`
   - `POST /api/leads`
   - `POST /api/chat` uses the public widget key, not the API key
3. Enable the n8n/webhook integration URL to receive `lead.created`, `lead.updated`, `lead.qualified`, `lead.hot`, `lead.dormant`, `lead.reactivated`, `lead.replied`, `followup.created`, `followup.completed`, `followup.failed`, `deal.won`, and `revenue.recovered`.

## Cron / follow-up worker

```
GET /api/cron/follow-ups
Authorization: Bearer $CRON_SECRET
```

Call every 5–15 minutes. Production fails closed without `CRON_SECRET`. Jobs are claimed with `PROCESSING`, batched, timezone-aware, and respect business hours.

## First Dubai client onboarding

1. Agency signs up with Clerk (`/sign-up`).
2. ReviveLead provisions a **new** organization + OWNER membership. Never Al Noor.
3. Complete `/onboarding`: UAE, AED, Asia/Dubai, team invites.
4. Import existing leads (CSV/Excel) from Import Center.
5. Import or add properties for the chatbot.
6. Open Intelligence: scores, dormant leads, labelled revenue-at-risk estimates.
7. Connect WhatsApp and send a confirmed test message.
8. Create a reactivation campaign, preview, owner confirms, then send.
9. Embed the website chatbot widget.
10. Owner starts a Paddle subscription from Billing.
11. Point Meta and Paddle webhooks at the HTTPS production URLs.
12. Confirm cron is running.

## Security notes

- Every lead, follow-up, automation and revenue query is scoped by `organizationId` from the session or a hashed API key — never from the browser body.
- Agents only see assigned leads.
- WhatsApp and Paddle webhooks verify signatures / tenant config.
- Cron fails closed in production without `CRON_SECRET`.
- JSON payloads over 100KB are rejected.
- API keys are hashed. WhatsApp tokens are never returned in full.
- Never log passwords, API keys, WhatsApp tokens, Paddle secrets, Clerk secrets, or OpenAI keys.

## Known limitations

- Clerk, Paddle and Resend are optional until their keys are set. Local Auth.js demo login remains.
- Rate limits are in-memory per instance.
- Credential encryption at rest is not implemented.
- SQLite is for local development only.
- HubSpot, Salesforce, Zoho, Pipedrive, Google Sheets and Google Calendar are abstracted, not implemented.
