# Isolated staging acceptance

Current status: PENDING target identification. This procedure authorizes no production migration or deletion and does not provision paid services. Use two disposable adult test accounts with synthetic application facts; no production database copy or real profiles.

The current accessible Vercel configuration shares CDP project/key entries between Preview and Production. Do not use those entries for the destructive Auth/session tests. Supabase organization `COACHFIAI` currently has one project and no development branches; a distinct disposable target is not established. Check the owner's choice and quoted cost before creating a project, and keep any nonzero cost pending explicit approval.

## Before connecting

Record the preview URL, candidate Git SHA, nonproduction hosting target, separate Supabase project ref and separate CDP project/test configuration. Compare project bindings with production using metadata, without exporting secrets. Have the owner confirm target ownership and disposable-data status. A preview URL alone is insufficient. Do not test through an old preview with unknown database bindings.

Use environment-specific secrets through the hosting/provider settings. Do not copy production credentials, inspect real sessions, place tokens in URLs, command logs, screenshots or reports. No `service_role` key may enter client bundles. Server identity must come from CDP token verification; user-supplied owner IDs cannot grant authority. Keep AI, voice calls, writes and payments off.

Confirm which auth model the deployment actually uses. The canonical CDP account migrations are `20261012120000_accounts.sql`, `20261012120001_leaderboard.sql` and `20261012195000_table_grants.sql`. The legacy `supabase/schema.sql` defines another auth/certificate model. Inspect the disposable target's schema/grants/FKs first; stop on drift instead of applying both. Creation/migration of a test project must be explicitly scoped, cost-free or separately approved, and never target the generic connected project by assumption.

## Reproducible local prerequisite

Run from the repository root with no real environment file:

```text
npm ci --ignore-scripts --no-audit --no-fund
npm ci --prefix tools/staging-db --ignore-scripts --no-audit --no-fund
npm audit --prefix tools/staging-db --package-lock-only --include=dev --include=optional --include=peer --json
node tools/staging-db/check.mjs
```

The runtime lock and SRI are validated before execution. The audit must contain zero findings, not just a successful installation. The guarded checker accepts no target/connection-string arguments, creates a fresh RAM-only PostgreSQL and saves raw output before validating17 exact identities, migration fingerprints and a zero-denial guard journal. Its `.tmp/staging-db/<runId>/summary.json` records the observed engine; this is not hosted Auth acceptance. CI performs the same child install/audit/check with a clean environment and exact-head binding.

## Controlled hosted acceptance

1. Record initial candidate and schema fingerprints. Seed only known fixture IDs A/B through the scoped test setup. Snapshot all four private tables per owner, not merely row counts. Test as anon/authenticated clients separately from the privileged service role; service-role access bypasses RLS and cannot demonstrate client isolation.
2. In PL and EN, test signup/signin, refresh, logout, expiry, malformed/forged bearer and actual provider revocation. Missing/invalid tokens return401 without data access. Changed expected-owner headers return409. Verify origin rejection and no-store on all private responses. Preserve failure codes and request identifiers only, never the tokens.
3. With A authenticated, attempt B identifiers in headers/query/body and direct client-table reads/writes. A must never receive or mutate B. Verify the four private tables have RLS and no client policies/grants exposing them. Check deployed child FKs are cascading. Do not broaden production grants to run a test.
4. Export A via `/api/account/export`. Compare every included allowlisted value with A's fixture, assert no B or credential canary, and verify declared omissions/independent-read consistency. Confirm no new account/progress row or timestamp appears. Repeat with missing accounts and controlled read failure; partial failure must not produce a success download. Test the existing local export separately; its scope is device data.
5. Delete A via authenticated `/api/account` only in the disposable target. All four declared app-table records of A disappear; B's full row snapshots remain identical. Repeat deletion. Replay the old identity at GET/export/PUT: no app data is recreated; PUT stays503. This does not prove token revocation. A still provider-valid token may remain authenticated until the provider actually revokes it.
6. In disposable SQL only, inject a child-delete failure and verify the complete parent deletion rolls back. Remove the fixture trigger immediately. Verify deletion versus any active writer/recovery path separately before enabling writes. Independent export reads are not a transactional snapshot under concurrent modification.
7. Test provider identity/session erasure only through the provider's supported, explicitly scoped test-account operation. Do not infer it from app-row deletion. Document local devices, external providers, retention/backups and recovery semantics, including any remaining requests requiring human handling. No automatic claim of complete legal compliance.
8. Remove fixture resources, confirm B remained unchanged before its own cleanup, preserve sanitized evidence, and obtain independent reviewer approval tied to the exact candidate. Missing/failed stages remain PENDING/FAIL. Production release is a separate decision.

The existing draft PR is configured not to deploy its feature ref. Do not merge, promote an old preview, alter that guard or deploy to production as part of this runbook.
