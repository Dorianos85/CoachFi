# Adult and parent-led family learning paths

20 October 2026. **Accepted for limited local review; production remains NO-GO.** This extends the existing audit corrections in PR #19. The Founder authorized publishing these changes to that PR, without merging or deploying them. The scheduled work loop remains paused.

## Result

- `/` offers two equally visible PL/EN entries for Poland, using PLN.
- `/adult` provides a personal budget or emergency-fund topic, lesson, quiz with answer explanations, and a declared next action. It uses the existing Coachfi light cards, lavender accents, Mila surface and shared button styles.
- `/family` provides needs/wants or a shared-goal topic, parent-led lesson and conversation prompts, quiz, and an optional activity outside the screen. No child account, name, age, household amount or free-text input is introduced. The adult makes household decisions; the child is not responsible for bills.
- `/adult/dashboard` preserves the previous GitHub `app/page.tsx` byte for byte. Existing adult features remain accessible there.
- Navigation separates the two exercise records. Changing a topic resets only its later steps. Reading the lesson and answering correctly are required before the plan step. A declared plan is not evidence that an activity was performed.

The adult example is fictional: `4000 - 3000 - 500 = 500 PLN`. The remainder is not automatically savings. The family example is fictional: `40 - 20 - 10 = 10 PLN`; these are not recommended household proportions.

## Data and access boundaries

New progress lives only in React memory, separately for adult/family and the current owner revision. Refresh, closing the document or changing the owner revision resets it. It is not saved to an account, local/sessionStorage, cloud or export. The interface explains this limitation. Existing required consent and the adult leader's 18+ declaration remain separate gates; choosing an audience grants neither a role nor consent. Optional consents default to off.

The entry and family shells do not mount the adult's private diagnosis, balances, token or streak cards. Stale owner callbacks are rejected before and inside the state updater. Mila displays prepared educational text; external AI, voice and cloud writes remain disabled. This prototype does not activate Kids Mode or production processing of children's data.

## Validation and independent review

Machine-readable summary: [validation.json](validation.json). Independent review: [REVIEW.md](REVIEW.md).

- **102 distinct selected unit/regression cases accepted**, including 29 new cases and 73 regressions. This is the union of recorded runs, not one new all-green full-repository run. Initial bootstrap EPERM executed zero cases. The first executed run had 85 PASS / 17 FAIL; one unchanged timed-out setup passed an exact-case retry, and 16 historical logout fixture mismatches passed after adapting extraction to the real adult wrapper. Original failures were retained locally.
- TypeScript passed. Subsequent real Next builds also checked final source types.
- **Four real Chrome scenarios passed** on the `local-final` build: PL/EN full paths and direct family entry, keyboard operation, consent dialog focus, separate progress, reset on refresh and unchanged personal storage after the explicit consent/age baseline. Page API/external requests and JS errors were zero; this is not a real-auth or whole-browser-network claim.
- A high-contrast finding was reproduced at 1.053:1, fixed only in scoped classes/CSS, and independently retested: **21 selected samples passed**, at least 17.7397:1, with visible keyboard focus and no mobile overflow. The original failure was retained.
- The later adult design correction changed only `app/adult/page.tsx`. After excluding presentation classes, two style constants and the button-style import, the remaining TypeScript AST is identical. Content, arithmetic, conditions, callbacks and gates did not change.
- **Latest build `adult-brand`: PASS, 38 app paths, 833 pinned source inputs without drift**, unchanged scoped runtime, 50 guard rows / 25 closed contexts / zero guard denials. Two explicit local font mocks were used; real fonts and staging were not accepted.
- Targeted adult presentation checks on 375px/1280px: 12 normal samples passed, minimum 6.4648:1. Initial high-contrast sampling had four PASS and one failure during the existing 0.12s color transition. Only that failed sample was retried after actual animations finished in 148.7ms: PASS at 17.7397:1 with the same 4.5 threshold. This accepts 17 distinct samples across two readings, not a fresh all-green 17-case run. Three viewport checks fit; selected keyboard focus passed. No product fix or threshold change was needed for the retest.

Previously green unit/full-flow checks were not repeated for this style-only correction or documentation/publication packaging. Both PL lessons and unanswered quizzes were also shown in the user's local browser; that demonstration is separate from synthetic Chrome testing. The three workspace-specific build/check/preview launcher scripts, machine paths, screenshots and runtime journals are not included in this publication. The committed Playwright config/spec remain local test aids: the config expects a separately started local preview and writes results under `../../evidence` relative to the repository. This is not a portable one-command CI pipeline.

## Publication and remaining gates

Target: existing PR #19, branch `codex/p0-security-consent-export`. Its unchanged `vercel.json` explicitly disables automatic deployment for that branch. No merge, production push, app deployment, migration, history rewrite, paid call or contact with people is included.

This package does not close the existing dependency or privacy findings. The earlier PR audit recorded 5 high / 7 moderate dependency nodes; no new audit is claimed here. Verified privacy contact and legal/operational facts, retention/provider/rights procedures, independent legal review, real Auth/RLS and two-account staging/rollback evidence remain open. Real fonts, screen-reader use and full WCAG conformance are not verified. Durable family progress and children's accounts/data require a separate approved scope.

Earlier audit corrections and their own validation remain documented in [the PR19 report](../release-pr19/REPORT.md). No local PASS is production approval.
