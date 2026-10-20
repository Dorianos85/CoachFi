# Independent dependency and CI review

20–21 October 2026. **ACCEPTED_LIMITED_LOCAL** for the reviewed update to the existing draft PR19. Publication may proceed within the authorized scope. Hosted CI of the final published head remains **PENDING** and is required before merge. Production remains **NO-GO**.

Dependency/CSS author: `c49_dependency_review`. CI author: `audience_shell`. Independent reviewer: `audience_qa`. The coordinator owns execution and integration. QA authored the additional design fixture; the coordinator independently reviewed its source, corrections and actual results. This review does not self-approve that fixture as an oracle.

## Source review and closed findings

Reviewed the Tailwind 4.3.3/PostCSS integration, Tailwind Merge 3.6.0, scoped Jayson 5 consumer, exact lock graph/integrity and retained Solana 1.98.4 consumer. No blanket major override or advisory exception was admitted. The actual in-memory consumer tests cover transport, batching, errors, UUID generation and class merging; they do not establish real authentication or RPC.

CI checks the requested head SHA using pinned official actions, read-only permission, nonpersisted credentials and explicit minimal child environments. Installation disables lifecycle scripts. The audit rejects every severity. Source review required guarded server cleanup and unique run/head/lock-bound receipts; both were corrected. Complete unit collection and exact browser identities remain required. No deployment, provider-secret, OIDC or artifact-upload step is configured.

Actual failures led to these bounded corrections:

- Restored exact historical Git bytes after independently verified checkout conversion. Finite attributes preserve committed mixed endings. Historical helper logic and expected hashes were not weakened; C2/C63 migration admissions remain explicit and reversible.
- Preserved the existing pastel formulas through the proper functional background root. Numeric modifiers 0–100 include an explicitly authorized correction for previously unsupported 3/4/8/12/18 values; missing old utilities are not claimed pixel-identical.
- Fixed a real layered-CSS regression: default anchor grape text overrode an explicit primary-button foreground, producing contrast 3.8189. Only that existing default rule moved into `@layer base`; all token values and other stylesheet bytes remain. The fixed ink/minimum 4.5 oracle was retained.
- Gave only C14's repeated slow import/setup hook 30 seconds. A one-change inverse proves assertions, other timeouts, retry, skip and product behavior unchanged.
- Corrected the QA fixture's missing actual onboarding dismissal, scoped animation readiness and hero-radius expectation against pre-migration source. All sampled targets are in one stable main; its descendant/ancestor animations still have the same 1500ms deadline and unknown targets fail. Outside-view diagnostics are bounded samples. Actual metadata did not confirm the earlier spinner hypothesis. Hero 20px and button 14px expectations follow the existing tokens; colors and contrast were not rebaselined to new output.

## Actual evidence and its limits

- Fresh exact-lock install and metadata hygiene passed. Saved complete lock audit: zero findings at every severity, with no exception or omission; the policy reused that raw result rather than issuing another audit.
- TypeScript passed. Final C38 generated-CSS retest passed all 14 cases after the anchor fix. The eight retained parser-security, seven consumer and 17 CI-policy cases passed in their documented normal run.
- Full normal collection in `local-integration-02`: 185 files, 3647 cases, **3646 PASS / 1 FAIL / 0 skipped**, with no empty files. Its receipt remains **FAIL**. Guard: 556 records/185 epochs, zero native/database denials. Two native files passed 11 cases. The corrected exact C14 failure subsequently passed once, with 24 cases explicitly unselected; no fresh full-suite green claim is made.
- Final product build in `local-integration-03`: PASS, 38 app paths, 50 guard records/25 initialized contexts, zero denials. Existing optional CDP import warnings for `x402-fetch` and `@base-org/account` remain.
- Browser evidence on that build: four PL/EN flows passed in run03; the two corrected design cases passed in `local-design-retest-04`, once each, with zero skipped/flaky/global errors. These are six distinct passed cases across runs, **not one six-case green local job**. Both final attachments show no API/external/WebSocket requests or page errors. Dashboard primary contrast is 9.91284, high-contrast heading 17.73972 and focused high-contrast control 6.70162. The guarded server recorded two rows/one context/zero denials; all 471 frozen inputs plus two build-output pins remained unchanged. The coordinator also inspected selected actual screenshots.

All initial and intermediate failures remain in the private workspace ledger `evidence/dependencies-ci-2026-10-20/`, which is not published. Local validation is based on `b162cfaa50bdba578907657a26a98d72f9cc5072`, final product/test freeze tree `84f8bbe919d7b4071e7ca03a0abc32dd86e0a3a1`, and the separately reviewed final diagnostic-only fixture change. Lock SHA256 is `7da5a471776e4dc29978cae8cd171cd9fb50d6f1fec9220f4aa03746e7b56b12`. These receipts do not establish hosted CI for a future commit; consult the final PR-head checks separately. See the integration [report](REPORT.md).

## Remaining release gates

Build fonts use explicit offline substitutions. Selected Chromium/color/focus checks establish neither real-font fidelity, broader browser support nor full accessibility. Node guards and request interception are not an OS-wide network sandbox. Real CDP/Auth/RLS, two-account staging, account export/deletion, privacy/legal facts and procedures, and rollback/monitoring still need independent evidence and authorization.

Learning progress remains RAM-only. Child accounts, live AI and new cloud-data features are separate scopes. This acceptance authorizes no merge, deployment, production write or paid call; the scheduled loop remains paused.
