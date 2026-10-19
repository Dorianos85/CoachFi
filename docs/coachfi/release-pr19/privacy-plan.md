# Privacy information — PR19 correction

Status: authored locally, pending independent source review and root-run tests. **Privacy/real-user production release remains NO-GO.** This change is not a legal-compliance approval.

The Founder identified Dorian Żaczek as the website owner. This is shown as an owner, without inventing a company, controller address, legal basis or other administrator particulars. No proposed mailbox is treated as active.

## Current source contract

PL/EN information now separates browser-local guest/account data, sign-in providers, initial account reads and application-server requests. The local-text chat route can receive a message on the application server; “local” must not imply that a message never leaves the device. Automatic uploads of new learning changes are disabled. Initial account reads may still occur, so local deletion cannot promise account/provider erasure or prevent later hydration.

External AI/ElevenLabs, leaderboard and Web3 actions remain disabled by the source release policies. Optional settings do not override hard-off. Browser/OS speech is a separate path; no universal offline/on-device guarantee is made. No claim is made about actual production provider configuration or staging behavior.

`DataSafetyPanel` is retained and not modified here. The notice describes selected sanitized export and local deletion, not a full account export, account closure, SDK-session removal or deletion at every provider. A separate author owns data-control/security changes and must be independently reviewed.

Legal pages render the revised Polish or English text. Other selected locales receive the English legal information and an availability notice; their seven historical copy records remain byte-for-byte unchanged in source. This avoids presenting stale provider claims as a newly reviewed nine-language policy. No nine-language acceptance is claimed.

## Public contact and finite release gate

`lib/privacy-config.ts` reads only these deliberately public build variables:

- `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL`: conservative ASCII mailbox format; no `mailto:` prefix, whitespace/control characters, query/header syntax or reserved example/test domain.
- `NEXT_PUBLIC_PRIVACY_CONTACT_VERIFIED`: exact string `true`, set only after the operator has provisioned and verified the real mailbox. This is an assertion, not a mailbox verification performed by code.

Without both, pages show a pending contact status and no email link. Do not add fictitious addresses or secrets to the variables. A configured contact does not complete the policy: `getPrivacyReleaseGate()` is deliberately false while controller identity/address/legal bases, retention/backups, processors/regions/contracts/transfers, rights/complaints procedures and independent legal review remain unresolved. Root release preflight must record and enforce this blocked result; this helper alone does not modify Vercel deployment settings.

Mailboxes are a separate zero-budget setup task. No signup, message, DNS/MX modification, production environment read or provisioning was performed by this author.

## Evidence and tests

Workspace `evidence/release-pr19-2026-10-19/privacy-before.json` preserves both complete prior sources. `privacy-change.json` holds complete before/after text, six unique mappings per page, whole inverses and literal seven-locale preservation. This is a **source baseline**, not a newly run failing test baseline.

`tests/release-pr19-privacy.test.ts` defines 11 meaningful cases: email/verification admission and injection/placeholder refusals; contact alone cannot approve release; four actual PL/EN page renders with matching visible/prepared spoken warnings; two privacy flow-scope render cases; English legal fallback; configured synthetic contact retains the incomplete-policy warning. React server rendering is real, while language, voice execution, data controls and the public config getter are explicit adapters. No SDK, real storage, environment or provider is exercised. Fixture authorship is not self-approval; root owns guarded execution and independent review.

Read source witnesses: `lib/server/api-access-policy.ts`, `lib/product-scope.ts`, `lib/sync/local-sync-state.ts`, `app/api/chat/route.ts`, `context/AuthContext.tsx` and the existing data-control implementation. Root resolves the pending cloud-sync merge; final source review must confirm those retained hard-off/read distinctions.

The EUR-Lex consolidated source request on 19 October 2026 returned a bot/JavaScript challenge. It was not bypassed or presented as a completed legal review. No current GDPR, DPA, transfer or retention compliance verdict follows from this technical correction.
