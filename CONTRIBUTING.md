# Contributing to Haber Var

Thanks for your interest. Haber Var is a small, personal project that runs a real newspaper for a real group of friends, so the bar is simple: changes should keep working for them.

## Before you start

- **Bug or idea?** Open an [issue](../../issues) first using one of the templates. For anything bigger than a few lines, agree on the approach there before writing code.
- **Security problem?** Do not open an issue. Follow [SECURITY.md](SECURITY.md).

## Development setup

You need Node.js 22+, a free [Supabase](https://supabase.com) project and a free [Cloudinary](https://cloudinary.com) account. The full walkthrough is in [Instructions.md](Instructions.md) (Turkish); the short version:

```bash
git clone https://github.com/kutay-atak/haber-var.git
cd haber-var
npm install
cp .env.example .env.local      # fill in the Supabase and Cloudinary keys
# run supabase/migrations/*.sql in the Supabase SQL editor, in filename order
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

All three must pass, and so must the tests:

```bash
npm run test:unit    # notification, backup and mirror logic against in-memory fakes
npm run test:sql     # migrations + row-level security against Postgres (PG* env vars, or --local, see tests/sql/run.sh)
npm run test:e2e     # Playwright against a production build; run `npx playwright install chromium` once
```

GitHub Actions runs the same four jobs on every pull request. If you change a policy or a function in `supabase/migrations/`, add or adjust a scenario in `tests/sql/`; if you change who gets notified or what gets backed up, extend `tests/unit/`. Describe in the pull request anything you checked by hand on top of that.

## Conventions

- **TypeScript, strict.** No `any` unless a third-party type forces it, and then with a comment.
- **Two languages.** Every user-facing string goes through `t("Türkçe", "English")` (see `src/components/i18n.tsx` and `src/lib/i18n.ts`). Turkish is the source language; write both.
- **Plain language.** Interface copy is short, warm and concrete. Avoid filler ("Lütfen", "Harika!", exclamation marks).
- **Database changes are migrations.** Add a new file under `supabase/migrations/` named `YYYYMMDDHHMMSS_short_name.sql`. Migrations must be **idempotent** (safe to run twice: `if not exists`, `create or replace`, `where not exists`) and must **never delete or rewrite user data**. Update the migration table in Instructions.md.
- **Security lives in the database.** Access rules are row-level security policies and security-definer functions, not `if` statements in the UI. If you add a table, add its policies in the same migration and think about who may read it before and after an issue is published.
- **Validate twice.** Zod in the server action, constraints or triggers in the database.
- **Free tier first.** Avoid changes that push a normal group over the free limits of Vercel, Supabase or Cloudinary. Media is processed on the client before upload for this reason.
- **Comments in Turkish, identifiers in English.** This matches the existing code.
- **Commits.** One change per commit, imperative subject line in Turkish or English, no trailers.

## Pull requests

- Keep them small and focused; unrelated refactors go in their own PR.
- Fill in the pull request template. Screenshots for anything visual, in both a phone-width and a desktop-width view.
- A maintainer will review within a few days. Be ready to adjust copy: wording is treated as seriously as code here.

## Code of conduct

By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).
