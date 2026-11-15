# Security policy

Haber Var stores personal writing, photos and votes for small private groups, so privacy problems are treated as security problems.

## Supported versions

Only the `main` branch is supported. There are no numbered releases; deploy from `main`.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Use GitHub's private reporting: on the repository page go to **Security → Report a vulnerability**. If that option is not available, send the maintainer (Kutay Atak) a direct message on GitHub asking for a private channel, without including details.

Please include:

- what you found and the impact (for example "a member can read another group's answers before publication"),
- steps to reproduce, ideally as SQL against the schema in `supabase/migrations/` or as HTTP requests,
- the commit or deployment you tested against.

You will get an acknowledgement within 7 days and a fix or a status update within 30 days. Credit is given in the fix's commit message if you want it.

## Scope

In scope:

- Row-level security policies, security-definer functions and triggers in `supabase/migrations/`
- Server actions and route handlers in `src/actions/` and `src/app/api/`
- Authentication flows (`src/app/auth/`, `src/lib/supabase/`)
- Media upload signing and verification (`src/lib/cloudinary.ts`)
- The backup and notification code (`src/lib/backup.ts`, `src/lib/push.ts`, `src/lib/notifications.ts`)

Out of scope:

- Vulnerabilities in Supabase, Vercel, Cloudinary, Cloudflare or Google themselves (report those to the vendor)
- Denial of service against free-tier quotas
- Issues that require a compromised maintainer account or stolen secret keys

## Design notes for reviewers

- Visibility of answers and votes is enforced in Postgres, not in the UI: `can_view_issue`, `issue_is_published` and the policies that call them.
- "Most likely to…" votes are never readable row by row by any client; only aggregated totals are exposed through a security-definer function.
- The service-role key, the Cloudinary secret and the email password are only read in server-only modules (`import "server-only"`).
- Uploads go from the browser to Cloudinary with a short-lived signature, and the server verifies Cloudinary's response signature before recording the file.
