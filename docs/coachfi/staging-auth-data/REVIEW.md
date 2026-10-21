# Independent review — account access, data operations and isolated SQL checks

Reviewer: `staging_independent_qa`. Date:21 October2026. Candidate prepared from PR19 head `05ffd4448ca180dd02b70ac08bc16ac2c91a0e9f`; the new published commit and hosted checks must be bound separately.

**Decision: ACCEPTED_LIMITED_LOCAL; production NO_GO; hosted staging PENDING.** No open must-fix finding remains in the reviewed local scope. This accepts the code, fixtures and local evidence below, not a real identity provider, a hosted database or a complete data-rights workflow. The reviewer authored none of the implementation, test fixtures, SQL harness or CI integration and did not repeat green executions.

## Reviewed behavior

The shared private API gate preserves origin and process-limiter checks before token verification; the expected-owner header remains only a consistency precondition. Tokens are bounded before CDP verification, missing verified IDs fail closed, all owned success/error/configuration responses are `no-store`, and fixed log codes omit upstream exception details. Existing DELETE JSON and the paused PUT503 contract are preserved.

The new export checks the owner of both the account and every certificate, rebuilds values from finite product schemas, omits arbitrary profile strings and credentials, and fails the whole operation on a failed component read. A missing account does not create one or query certificates. Its selected scope, omissions and independent reads are explicit. It is a server endpoint, not a new browser rights flow or a full subject-access response.

The store no longer inserts progress as a side effect of a legacy-snapshot read. SQLite first-open bootstrap can still write; the verified read-only guarantee applies after initialization. Supabase deletion issues one owner-filtered parent DELETE rather than four independent child/parent requests. The unchanged canonical migration supplies three cascading child foreign keys. Actual SQL verifies atomic rollback and full preservation of B's values. Application-record deletion explicitly does not claim external identity deletion, session revocation or backup erasure.

The SQL harness uses a fresh RAM-only PGlite database with the three active CDP migrations, not the incompatible legacy UUID Auth schema. It checks default table privileges and actual RLS denial even after fixture-only client grants. Synthetic SQL claims and a service-role bypass are distinguished from signed bearer identities and user authorization at the API. No database target/URL is accepted. Minimal child environments, the unchanged native network guard, raw-first recording, exact scenario identities, migration fingerprints and the separate pinned runtime lock were reviewed. CI installs that tool with lifecycle scripts disabled, requires audit0 and runs the guarded SQL check.

## Evidence inspected

- API baseline:33 FAIL, including absent new export functionality and missing controls; these are not33 separately established vulnerabilities. The final unchanged set has33 new PASS plus26 unchanged historical PASS in one59-case run, no skips. Actual route code uses mocked provider/store boundaries.
- Store baseline:12 PASS/6 FAIL. The same18 cases passed after correction. They include actual memory SQLite, rollback after a trigger refusal, unchanged B, read-only initialized access and the actual installed Supabase JS client with a controlled synthetic fetch. The fetch models the remote cascade contract; it does not execute hosted PostgreSQL.
- SQL:17 exact scenarios passed on PostgreSQL18.6 through PGlite0.5.10. They cover four private tables, both client roles and two synthetic owners, all four INSERT denials, UPDATE/DELETE/SELECT denial, cascading children, full-row rollback, B preservation and repeated deletion. The guard journal contains2 records/1 initialized context/0 denials. Nine wrapper inputs remained identical before/after.
- Admission policy:10 native checks passed with0 failed/skipped/cancelled/todo. These are tool checks, not additional product accounts.
- Both authored runtime runs exited0 with no guard denial. All59 API and18 store case identities were compared directly with their baselines. Source/fixture fingerprints and the raw results were inspected independently. These separate runs are not a new complete application-suite result.
- TypeScript first failed with two fixture-only `count` property errors. Exactly two row type assertions corrected them. Reversing those edits reconstructs the original fixture hash; TypeScript5.9.3 emits identical JavaScript before/after. The18-case local runtime result retains that qualification; it was not rerun solely for erased type syntax. A second TypeScript run exited0 with empty diagnostics.
- The isolated SQL runtime audit reports0 at all severities; the application package manifest and lock have no diff. Exact-head hosted CI, full regression and compilation are still required after publication.

The workspace ledger is `evidence/staging-auth-data-2026-10-21/qa-plan.md`. It records source hashes, raw result locations, boundaries and the preserved failures. Raw logs, databases, runtime caches and credentials are outside this publication.

## Findings and limits

QA-SRC-01 identified reader backfill and repeated SQLite bootstrap writes; source correction and the focused runtime retest close it for initialized local reads. QA-TOOL-01 required full ordered A/B snapshots instead of counts alone; the author corrected the harness before its first execution, and the SQL result verifies that oracle. Both findings are closed in the stated local scope.

The runbook accurately keeps target identification and actual hosted acceptance pending. PostgreSQL18.6 in WASM does not establish parity with an unbound remote PostgreSQL17 project. There is no fresh proof of a correctly bound Coachfi staging environment, real signup/signin/refresh/logout, cryptographic provider token validation, old-token revocation, deployed schema/grants, browser-to-provider-to-database flows or provider identity erasure. A provider-valid old token may still authenticate after application rows are deleted; no app data should be recreated, and PUT remains disabled.

Full provider exports/deletion, retention/backups, concurrent-writer recovery, an end-user account-rights UI and operational release gates remain open. No child accounts, new personal-data tombstone, paid service, production migration, merge or deployment is introduced. The paused loop and the existing feature-ref deployment guard remain unchanged.
