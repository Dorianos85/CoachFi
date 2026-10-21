# Light adult and family paths — 21 October 2026

The path selector now uses Coachfi's cream background, white cards, dark text and lavender actions. The adult-led family path uses the existing adult tokens for cards, focus, progress and prepared Mila guidance. Success and retry feedback remain distinct. The existing adult page is unchanged.

Only presentation classes in `app/page.tsx` and `components/family/FamilyLearningPath.tsx` changed. Content, element structure, state, handlers, consent and account boundaries are unchanged. The only global CSS change is `body`'s minimum width from `320px` to `min(320px, 100%)`: this accommodates a scrollbar-reduced viewport instead of clipping the right edge at 320 px.

## Reviewed source

Independent reviewer: `staging_independent_qa`, distinct from both authors. Verdict: `ACCEPTED_LIMITED_LOCAL_SOURCE_AND_VISUAL`.

| File | Raw local CRLF SHA-256 | Git LF SHA-256 |
| --- | --- | --- |
| app/page.tsx | 7c7442ecdfc7b2cc0637576d5794baebcb8deadfdf4a73c197b2a586429508a8 | 149b6a881d0e0f6c1f2fcda9e0d9ff96b9338dea7e074835426cd0670d6ad5d8 |
| components/family/FamilyLearningPath.tsx | ef8c96f898665b189e5bb5b7a6930c064dedd3d5f64887c54a2c0ee8d7114dcf | 2fd1fd1531066fcffe09b48ecd6c95e2c0957e763e1df5edbe2a65ba60c36080 |
| app/globals.css | 0b895e6af24d394c1108abd27d4f86bb6374093934b34feab2515fb4967223cc | 5e04a98fdcef2211372f7d0f1cb9f24fe20e4de9288a496403e825a5034d49bc |

Git uses canonical LF line endings; the reviewed local files retain CRLF. Line-ending normalization does not change the presentation patch or other local work.

Whole-file inverse comparisons preserve all non-presentation source. The later CSS inverse reproduces the previous complete stylesheet. A suspected mobile screenshot clipping issue was checked using actual element bounds: cards and Contrast ended at288.8 px within a305 px content viewport, with no main/header descendant outside it.

## Local validation and limits

- Actual local browser: selector, adult and family pages in PL/EN, desktop1280 and mobile320; three high-contrast views and a visible keyboard-focus ring.
- Final mobile retest: six correctly hydrated route/language combinations, each with clientWidth=scrollWidth=305 at viewport320.
- PL desktop examples: adult lesson and quiz; family lesson, retry after20 PLN and correct10 PLN answer. Only previously authorized required consent and adult confirmation were used; optional settings stayed off. No provider or child data was used.
- Final local build04: compilation and TypeScript passed,39 routes and548 frozen source inputs without drift. The network guard recorded50 events/25 contexts/0 denials. Font CSS was an explicit offline Arial fixture; original external font delivery was not tested.
- Failed build01/03 attempts (EPERM in generated output), unsuccessful preview launches and an excluded loading capture remain failures in local raw evidence. They are not relabeled as product passes.

The local validation tree includes other previously accepted, unpublished work and Next15.5.28. This design-only publication preserves PR19's existing dependency lock and CI. Its exact commit needs its own GitHub Actions result; the earlier green run at0bffa74 does not validate the new commit. No duplicate unit tests were added for reversible CSS classes.

Raw browser captures, build logs and full independent review remain in the workspace's `evidence/light-audience-design-2026-10-21/`; private machine details and raw journals are not published here.

No merge, production deployment, remote migration, provider call, new data collection or external AI enablement is part of this update. Vercel's disabled deployment rule for the PR feature branch is preserved. Production remains NO_GO and the scheduled loop remains paused.
