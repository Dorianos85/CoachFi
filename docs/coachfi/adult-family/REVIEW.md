# Independent review: adult and parent-led family paths

20 October 2026. Reviewer: `audience_qa`, independent of the application authors. **GO for publishing this reviewed package to existing draft PR #19 only. Production remains NO-GO.** Publication is authorized but has not yet been performed at the time of this review; the final staged tree and subsequent push require their own receipts.

## Scope and source review

The reviewed change provides the PL/EN audience selector, adult guided exercise and parent-led family exercise, shared navigation and consent/18+ readiness gates. New progress is separate by audience and owner revision, held only in memory. It introduces no child account or child-data fields. The previous dashboard is preserved byte for byte at `app/adult/dashboard/page.tsx`, SHA256 `b8534927119af0b0435338834ac29efeb14b2f880fb79919c95f874ed2e8f8e6`.

Independent review covered state transitions, malformed inputs, immediate owner changes, stale callbacks and deferred state updaters, consent/export boundaries, PL/EN educational copy, keyboard operation and selected contrast samples. The final adult presentation uses existing Coachfi cards, lavender accents and button styles. After excluding only presentation classes, two style constants and the button-style import, its remaining TypeScript AST matches the previously reviewed adult version. Final `app/adult/page.tsx` SHA256: `03850ad1ddd0dad8aae041413cf1b67c7c4fc469a824fe63b6de6d3eef5e3459`.

The publication scope is 27 paths: seven modified shared application files, the current-cycle note, three adapted regression fixtures, thirteen new application/test/configuration files and these three portable review documents. It excludes local screenshots, browser profiles, journals and all three workspace-specific `tools/adult-family-{build,check,preview}.mjs` launchers. The final staged path and byte checks are separate from this prose review.

## Evidence accepted, with limits

- The 102 distinct selected unit/regression cases are a union across recorded runs: 29 new and 73 existing. The first executed run was 85 PASS / 17 FAIL. One unchanged setup timeout passed an exact-case retry; sixteen logout cases passed after adapting the legacy fixture to the real adult navigation wrapper. Initial failures remain evidence. This is not one fresh all-green full suite.
- Four fresh-profile Chrome scenarios passed on `local-final`, covering PL/EN paths, direct family entry, keyboard/consent focus, audience separation, reload reset and unchanged personal storage after explicit synthetic consent/age setup. Page API requests, external requests and JS errors were zero. This does not establish real authentication or whole-browser network isolation.
- The initial high-contrast failure at 1.0534:1 was retained. The scoped correction passed 21 selected samples on `contrast-final`, minimum 17.7397:1, with selected focus and mobile fit checks.
- The later adult design correction passed twelve normal samples on 375px/1280px, minimum 6.4648:1. Its first combined reading was 16 PASS / 1 FAIL: the remaining high-contrast button was sampled during the existing color transition. Only that failed sample was repeated, after actual animations finished in 148.7ms, at the unchanged 4.5:1 threshold; it passed at 17.7397:1. Seventeen distinct samples are accepted across two readings, not one fresh green seventeen-case run. No application change was made for that retest.
- The final `adult-brand` Next build passed: 38 app paths, 833 pinned inputs without drift, native type checking, unchanged scoped prepared runtime, 50 guard rows / 25 closed contexts / zero denials. Two explicit local font mocks were used. Previously green unit and full-flow checks were not repeated for the presentation-only correction or documentation packaging.

The coordinator independently reviewed the reviewer's test tools and fixtures. Detailed local raw evidence was read during review but is deliberately excluded from this publication. [REPORT.md](REPORT.md) and [validation.json](validation.json) preserve the portable outcome and qualifications; they do not replace raw logs or claim fresh-checkout reproducibility. The dedicated Playwright configuration expects a separately prepared local preview and writes artifacts relative to `../../evidence`; the omitted local launchers are not a portable release pipeline.

## Publication boundary

The authorized destination is the existing PR #19 head, `codex/p0-security-consent-export`, starting at `c63e46d1ed101721043ed17da28fe9bca6ef2a36`. The inherited `vercel.json` explicitly sets deployment to `false` for that exact branch; its Git blob is `c1daff9a50f0d90ecb3475ceb5f0e63203ac4e09`. This is verified configuration source, not a claim that a deployment service was independently observed after publication. No merge, deployment or production change is approved.

Existing dependency and privacy findings remain open. This review does not accept real fonts, screen readers/full WCAG, real Auth/RLS, two-account staging, rollback, legal compliance, educational effectiveness, durable family progress or children's accounts/data. Those require separate evidence and authorization. Publishing reviewed code to the draft PR does not change the production NO-GO decision.
