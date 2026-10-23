# C56 — whole SRS counters in the selected local export

Status: source candidate confirmed; baseline pending. Adult Poland, PL/EN, no product mutation before baseline.

Problem: data-export.ts admits fractional interval/repetitions through generic finite-number validation, while actual readReviewCards rejects both as non-safe-integers. Example known question inflation-basics with interval1.5 or repetitions0.5. Selected export should omit these malformed cards without rounding, raw repair or ownership changes.

Bounded patch: exactly two admission expressions in lib/data-export.ts. Preserve existing export limits interval1..90 and repetitions0..100000, easeFactor fractions, known-ID/date checks, slice1000 and per-card omission. Do not claim full equality with strict Review (which permits interval0, has no identical caps, and rejects duplicate IDs). No SRS reader/writer, data migration, new field, UI or policy change.

Root: coordinator/tools/execution/metadata. c49_validation: product proposal/apply after baseline and independent review, integrity triage. c49_advisories: fixture author only plus independent product/data review (excludes own fixture approval), consent/profile triage. c49_dependency_review: independent source/fixture/tools/raw review, security/auth triage. Root peers fixture; author cannot approve own result; root+3 maximum.

Evidence: actual sanitizer/collector/paired current-owner builder, real strict Review read as source-of-constraint witness, synthetic physical storage Maps/owner leases. Cover fractional interval and repetitions independently, keep integer boundaries and fractional ease/monetary values, selected unrelated fields and owner isolation literal, no writes/notify/network. Fixture final counts will be recorded from raw, no guards counted as extra tests. Run new baseline once, same acceptance once; only affected historical export cases once, one TS and one isolated TEMP build using existing runtime. No new Chrome: no UI change; download/browser/full-cloud rights remain untested. Green historical tests without overlap remain unrun.

Carry forward C55 authoritative source-freeze-current.json: all196 current unique tuples directly, no supplement. Bootstrap qualifies only the historical C55 fixture type-cast difference976→d901 in its563-build input list with actual emittedJS proof; new563-current capture then immutable. Target export is the one explicitly qualified changed prior/preserve path; other195prior pins and12preserve literal. C55 receipt and closure remain immutable. Dependency C50 deferral stays historical, no network polling. Disabled achievement/ShareScore source findings are not an active-path bug.

All results local, not clean-install or staging. AI/cloud writes HARD_OFF; production NO_GO. No git add/commit/push/deploy, provider calls, migrations, production writes, real profiles/secrets or human contacts.
