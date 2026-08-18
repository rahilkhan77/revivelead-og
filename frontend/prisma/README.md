# Database (Prisma)

ReviveLead uses Prisma only. There is no Supabase client and no Supabase Auth.

## Which schema is used where

| File | Engine | Used by |
|---|---|---|
| `schema.prisma` | SQLite | Local `prisma generate`, `db push`, seed, and `next dev` |
| `postgres/schema.prisma` | PostgreSQL | Production migrations (`migrate deploy`) |
| `postgres/migrations/20260815170000_init` | PostgreSQL | The committed production migration. Do not delete it. |

`npm run db:prod:schema` copies `schema.prisma` into `postgres/schema.prisma` and sets `provider = "postgresql"`.

`scripts/prepare-prisma.mjs` (runs during `npm run build`) switches the local schema provider to `postgresql` when `VERCEL` is set or `DATABASE_URL` starts with `postgres`. It does not run against a database.

## Local development

```
DATABASE_URL="file:./dev.db"
npm run db:setup
```

That uses SQLite. Do not point local `DATABASE_URL` at a hosted Postgres/Supabase project while running `next dev`.

## Production (later)

Set production `DATABASE_URL` to a PostgreSQL URL. Apply the committed migration:

```
npx prisma migrate deploy --schema prisma/postgres/schema.prisma
```

Do not run `migrate reset`, `db push` against production, or `db:seed` in production unless `ALLOW_DEMO_SEED=yes` is set on purpose.
