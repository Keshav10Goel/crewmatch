# CrewMatch — Team Discovery & Collaboration

A Next.js + Supabase MVP foundation for discovering teammates and opportunities for hackathons, college projects, startups, research, and open source.

## Current implementation

- Responsive public landing page and app shell.
- Supabase email/password signup and login, auth callback, route protection.
- Profile editing: skills, interests, goals, roles, availability, experience, discoverability.
- Teammate discovery with search, skill filtering, explainable deterministic matching, connection requests.
- Opportunity marketplace, publishing form, detail pages, application submission.
- Dashboard based on database queries.
- Connections list with accept/decline/withdraw/disconnect actions.
- Teams and project listing views.
- Notifications and settings shells.
- Reusable matching engine for person-to-person and person-to-opportunity scoring.
- SQL schema, indexes, profile-on-signup trigger, and RLS policies.

## Important status note

This is a substantial MVP scaffold, not a claim that every item in the full master prompt is finished. Before production, complete and verify the acceptance workflow (including atomic role capacity and team creation), full threaded Realtime chat, notification triggers and read-state actions, block/report UI, external profile links in the editor, saved-profile UI, cursor pagination, admin moderation, full E2E tests, and production security review. The current UI intentionally labels incomplete areas instead of implying they work.

## Requirements

- Node.js 20.9+ recommended
- A Supabase project

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or Supabase publishable key)

3. In Supabase SQL Editor, run `supabase/migrations/0001_initial_schema.sql`.
4. In Supabase Auth settings, configure your local redirect URL:
   - `http://localhost:3000/auth/callback`
   - Configure the site URL to `http://localhost:3000` for local development.
5. Start the application:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000`.

## Environment and secrets

Never put `SUPABASE_SERVICE_ROLE_KEY` in a `NEXT_PUBLIC_` variable or expose it to client components. This app's browser and server Supabase clients use the public anon/publishable key and rely on RLS.

## Matching engine

`src/lib/matching.ts` contains a deterministic baseline. It returns a 0–100 normalized heuristic score, component scores, reasons, unknown signals, and role suggestions. It is not trained ML and is not a probability of success. Unknown components are omitted from the weighted average rather than automatically treated as negative signals.

## Architecture

- `src/app`: App Router pages and route handlers.
- `src/components`: UI and client interactions.
- `src/lib`: Supabase clients, validation, matching.
- `supabase/migrations`: schema and access policies.

## Before public launch

- Apply and test RLS policies with separate users and roles.
- Add rate limiting and abuse controls for auth, connection requests, applications, reports, and messages.
- Add atomic RPCs for application acceptance, role capacity, and team membership.
- Add complete privacy policy, terms, community guidelines, contact details, and account deletion.
- Configure email deliverability, domain redirects, storage buckets/policies, backups, monitoring, and error reporting.
- Run `npm run typecheck`, `npm run lint`, build, and automated tests in a network-enabled environment.
