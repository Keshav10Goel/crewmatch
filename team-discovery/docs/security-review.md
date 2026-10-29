# Security review checklist

- [ ] Apply migrations in a non-production Supabase project first.
- [ ] Verify every RLS policy with at least two ordinary users and an unauthenticated session.
- [ ] Add database RPCs for status transitions and role-capacity enforcement; never trust client-only status changes.
- [ ] Add server-side authorization for opportunity review, application decisions, block/report, and team administration.
- [ ] Add request rate limits and abuse detection.
- [ ] Validate external URLs and prevent unsafe redirect targets.
- [ ] Ensure profile selection never returns private contact details.
- [ ] Review RLS policy recursion and test `team_members` membership policies.
- [ ] Add admin-only moderation paths without exposing service-role credentials.
- [ ] Configure storage buckets with explicit object-level policies.
- [ ] Add data retention, account deletion, export, privacy policy, and incident response.
