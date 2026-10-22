# Learning-access recovery

Two bounded corrections preserve the adult and adult-led family learning gates while making failed initialization recoverable. No new data, service, dependency, upload or deployment is introduced.

## Behavior

- A never-settling account token, GET or JSON body previously left storage ownership pending indefinitely. Account initialization now has one monotonic 30-second budget across all three phases. Expiration exposes the existing current-owner local-only view with unavailable/unconfirmed status. It preserves local data and the ownership lease. Late results/rejections cannot resume hydration; logout, disposal and owner changes still fence stale work immediately. This bounds the application's wait, not physical work by an SDK or transport that ignores cancellation.
- A physical local-storage failure when saving the 18+ declaration previously escaped the click handler without actionable feedback. The provider now returns an explicit persistence outcome. Failure or stale ownership cannot adopt confirmation, close settings or notify the cloud bridge. The dialog retains its gate and checkbox and offers privacy-safe PL/EN feedback and explicit retry. Existing consent, forced-dismiss, focus handlers, family scope and visual classes are preserved. This remains a self-declaration, not verified age.

Scope: `lib/account-sync.ts`, `context/ModeContext.tsx`, `components/ModeGate.tsx` and two new regression fixtures. Existing test oracles, dependency locks, CI workflow and Vercel deployment rule are unchanged.

## Evidence and independent review

Before product edits, the two new fixtures were independently reviewed and run against the old product. The first sandbox execution failed collection with a temporary SSR rename EPERM and zero cases. It remains an execution failure. The unchanged reviewed tool in an approved local context then ran all 22 cases: 8 passed, 14 failed, none skipped. Those scenarios establish two defects, not fourteen independent issues.

After independently reviewed product changes, the focused retest passed all 46 cases: deadline 14, confirmation recovery 8, existing C3 account review 14, C4 sync/ownership/delete 7 and product scope 3. No cases were skipped. The actual offline guard recorded five complete worker epochs, 16 records and zero native/DB denials. TypeScript `--noEmit` passed separately with its exact one-row capture-only guard and no source drift. A type-only generic correction in the new deadline fixture preserves every runtime oracle and identical JavaScript emitted by TypeScript 5.9.3.

Authors: `data_rights_triage` and `learning_flow_triage`. Independent reviewer: `development_qa`. Root coordinated the bounded tool, execution and integration. The reviewer checked complete source forward/inverse, fixtures, tool revisions, actual raw results/journals and record preservation. Neither author approved their own result. Local verdict: **ACCEPTED_LIMITED_LOCAL_RECOVERY_FIXES**.

The frozen local tree had 553 admitted source entries. After the before-product capture, exactly three product files and the type-only fixture annotation changed; 549 other hashes, seven runtime pins, Git head/branch and empty index were preserved. Both new fixtures already existed in that capture. This is a three-source/two-fixture patch, not a four-file patch.

## Limits and publication gate

These are real local code executions using synthetic account IDs, Maps, fetch promises and a fake clock. The confirmation fixture uses the actual provider/gate/storage/validator with an explicit hook scheduler, Radix/Button adapters and consent/locale/path stubs. It does not establish native modal/focus/screen-reader behavior, real CDP identity, hosted Auth/RLS, revocation or full provider-data rights.

Local validation used Next 15.5.28 in a tree containing separately accepted, unpublished work. This publication keeps the PR's existing Next 15.5.27 lock. Relevant source dependencies and test runtime entries were compared against the published base; exact-head hosted CI is a separate gate after publication. The prior green design run is historical evidence for its own commit. No new local build or browser run is claimed, and existing previews were not replaced.

Production remains **NO_GO**. The existing PR branch stays deployment-disabled and draft. No merge, production deploy, remote migration, real-profile/session/secret read, paid call, child account/data or external AI enablement is included. Other unpublished local packages remain outside this update. Raw local journals, machine-specific paths and embedded source snapshots are retained privately in the workspace evidence and are not published by this report.
