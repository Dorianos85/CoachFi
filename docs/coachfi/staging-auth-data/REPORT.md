# Staging, account access and data rights — 21 October 2026

Scope: PR19, prepared from `05ffd4448ca180dd02b70ac08bc16ac2c91a0e9f`. No merge or production deployment. The original working copy and preview on port43191 remain preserved; the loop is paused.

## Corrections

Private account routes share a verified CDP identity gate. Every response, including errors and unavailable configuration, has `Cache-Control: no-store`. A bearer is length bounded before SDK verification. An expected-owner header is a precondition, never authentication. Stored account/certificate owner mismatches fail closed. Logs contain fixed error codes instead of provider/storage exception text. Account writes remain paused with503.

`GET /api/account/export` downloads selected, validated application facts for the verified owner. It excludes credentials, raw profiles, free text, health/vault fields and chain addresses/transactions. The JSON labels its scope, omissions and independent-read consistency; it is not a complete subject-access export or transactional snapshot. Missing accounts are explicit and do not trigger certificate queries. Failed component reads fail the whole request. This is a server endpoint; the existing local export UI retains its separate device-only scope.

Reading legacy account progress no longer backfills Supabase or SQLite. SQLite bootstrap/schema migration can still write on first opening; later reads of the initialized store do not rerun migration/backfill. Supabase application-data deletion now makes one owner-filtered parent DELETE, relying on the canonical three foreign keys with `ON DELETE CASCADE`. Failure therefore rolls back that SQL statement instead of leaving four separate deletion requests partially applied. Existing API JSON stays compatible; headers explicitly state that external identity deletion and provider session revocation were not performed.

## Evidence and independent review

Three specialists have separate source ownership. `staging_independent_qa` reviewed both authors' code, fixtures, unchanged historical regressions, raw process results and guards; the coordinator authored the SQL harness and CI integration, independently reviewed by the same QA specialist. Authors do not approve their own work.

- API:33 new cases and26 unchanged historical cases PASS in one59-case run. The original33-case FAIL baseline is preserved; this includes absent new functionality, not33 independent exploits. Identity-provider/store boundaries are mocked.
- Store:18 cases PASS after the preserved12PASS/6FAIL baseline. Actual memory SQLite verifies read-only initialized access, owner isolation and rollback; actual Supabase SDK uses controlled HTTP responses, not a hosted database.
- SQL:17 exact scenarios PASS with the three unchanged canonical CDP migrations on actual in-memory PostgreSQL18.6 via PGlite0.5.10. They check RLS/default denial for anon/authenticated, CRUD refusal despite fixture-only grants, service-role bypass, all three cascades, rollback on forced child failure, repeated deletion and complete preservation of B's rows. Claims are synthetic SQL settings, not signed JWTs. The network guard records2 initialized records/1 context/0 denials. No network or persistent database is used. This engine differs from the unbound hosted project's PostgreSQL17; version parity and hosted Auth/PostgREST remain unverified.
- Harness admission:10 native cases PASS, including rejection of missing/duplicate/skipped scenarios, changed migration hashes and unreviewed lock/runtime inputs.
- The SQL runtime has its own exact two-entry lock, public registry/SRI and zero findings at all audit severities, with lifecycle scripts disabled. The product package manifest and lock are unchanged. CI adds a locked/audited isolated-database stage; exact published-head execution remains required.
- Integration TypeScript initially found two fixture-only property typing errors. Two precise type assertions corrected them, with byte-identical emitted JavaScript independently verified; the18 green store cases were not repeated. The first failed result is retained. Final TypeScript retest PASS, exit0.

Local evidence remains in the workspace ledger `evidence/staging-auth-data-2026-10-21/` and its referenced raw results. Raw output, credentials, databases and test runtime caches are not published.

## Remaining acceptance gates

**Production NO_GO. Hosted staging is PENDING.** Old Vercel previews exist but do not establish database/CDP isolation or the current candidate. A connected generic Supabase project has no demonstrated Coachfi/staging binding; no database queries, keys or destructive tests were performed there.

Further read-only discovery found one accessible Coachfi Vercel project, no custom environments, and one project with no development branches in the Free Supabase organization `COACHFIAI`. Current Vercel metadata assigns the same CDP project/key configuration entries to both production and preview, with no branch-specific override for those entries. This is shared configuration, not an isolated test identity project; it does not inspect the runtime configuration of historical deployments. Supabase preview/production variables have separate metadata entries, which alone cannot prove separate databases. No secret was revealed/decrypted or used. A separate staging organization/project decision remains pending; absence from these connections does not establish absence from other accounts.

Follow [the staging runbook](STAGING.md) only after a separate target is identified. Outstanding evidence includes real signup/signin/refresh/logout, signature/expiry/revocation rejection, two controlled accounts through browser→API→database, deployed grants/FKs/schema, export/delete/replay, failure recovery and cleanup. Full provider deletion, retention/backups, provider session revocation and a complete rights workflow remain open. No tombstone or additional personal-data collection is introduced. The legacy UUID `supabase/schema.sql` is a different model and must not be combined blindly with the CDP migrations.

The new selected export does not solve all-provider rights requests. Existing public account PUT remains disabled; enabling concurrent writes, reconciliation or paid/AI features requires separate acceptance.
