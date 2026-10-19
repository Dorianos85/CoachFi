# Coach FI Roadmap

**Version:** 1.0

**Review date:** 13 October 2026

**Planning horizon:** October 2026 to H2 2027, with later-stage gates

**Product:** Coach FI / CoachFI AI

## 1. Purpose

This roadmap moves Coach FI from a working hackathon MVP into an evidence-led, accessible financial education product. It prioritizes learner value, trust, retention, and a viable commercial model over feature count.

The controlled release baseline is **Adult / US / English / free**. Broader family positioning, Kids and Teen modes, PL/EU localization, white-label delivery, regulated integrations, and Solana mainnet remain gated expansion paths.

## 2. Current evidence pack

### Observed and confirmed

- A public Next.js MVP is available at `coachfiai.com`.
- The product includes a Financial Health Check, short lessons, quizzes, Mila AI and voice experiences, progress mechanics, accessibility controls, and Rewards.
- The Solana Devnet rewards and certificate flow is operating, as confirmed by the project owner.
- Wallet connection and blockchain participation are optional for ordinary learning.
- Coach FI Brand V6 and Nunito are the current design baseline.
- The English White Paper defines the product boundaries, architecture, evidence model, and trust gates.
- The repository contains product, security, launch, and distribution documentation plus automated test coverage.
- Older architecture, rollout, and QA notes still describe Devnet funding or minting as incomplete; Phase 1 must reconcile those statements against fresh Explorer-linked evidence.

### Evidence still required

- One independently reproducible Devnet certificate example containing the transaction signature, asset address, expected owner, metadata, invoked program or standard, and transfer test.
- Baselines for acquisition, activation, first meaningful action, Day-7 retention, and learning retention.
- Evidence of willingness to pay from a narrowly defined buyer segment.
- Delivery cost, AI and voice cost per activated learner, gross profit, and contribution margin.
- Current cash runway, approved spend, and weekly founder and engineering capacity.
- Formal legal, privacy, security, accessibility, and child-safety reviews for each applicable release scope.
- Production-ready authentication, consent history, data retention, deletion, and incident-response controls.

### Current assumptions

- The first commercial wedge is one focused B2B financial-education pilot.
- The consumer MVP remains the learner experience and evidence engine.
- Certificates represent completion of a published learning rule; they do not represent profit, creditworthiness, or a professional qualification.
- Coach FI does not require or plan a tradable token or tokenomics model.

## 3. Dominant constraint

The dominant constraint is **credible product evidence**, not feature availability.

Coach FI already demonstrates a broad product vision. The next stage must prove that a clearly defined audience can understand the product, complete a meaningful learning action, return, and obtain a reproducible certificate without introducing unacceptable safety, privacy, accessibility, or financial-regulatory risk.

## 4. Roadmap principles

1. One primary audience, learner problem, and call to action per validation cycle.
2. Every release has a metric, baseline, target, owner, deadline, and stop rule.
3. Learning outcomes and real actions matter more than time in the app, points, streaks, or blockchain activity.
4. Financial education stays separate from personalized financial advice and product recommendations.
5. Personal financial details, quiz answers, and learning history remain off-chain.
6. Wallet connection and certificate minting remain optional and require separate consent.
7. Kids and Teen releases require independent privacy, legal, accessibility, and child-safety gates.
8. Mainnet is considered only after verified demand, reliable Devnet evidence, key-management readiness, and human approval.

## 5. Roadmap overview

| Phase | Timing | Primary outcome | Exit gate |
|---|---|---|---|
| 0. Baseline | Completed by 13 Oct 2026 | Working public MVP, operating Devnet flow, Brand V6 White Paper | Current state documented without unsupported claims |
| 1. Evidence-ready beta | 13 Oct–30 Nov 2026 | Reproducible Devnet proof, trusted data foundation, instrumented core loop | Evidence pack complete; no open critical trust issue |
| 2. Adult product validation | Dec 2026–Jan 2027 | Validate activation, learning, and Day-7 return with a narrow adult cohort | Predefined activation and retention gates met or a clear iteration decision recorded |
| 3. First paid pilot | Q1 2027 | Deliver one focused eight-week B2B pilot | Sponsor accepts outcomes report; delivery economics measured |
| 4. White-label and PL/EU readiness | Q2 2027 | Prepare one jurisdiction and one partner deployment model | Legal, privacy, security, accessibility, content, and data-role gates passed |
| 5. Controlled scale | H2 2027 | Renew or expand a proven offer and improve contribution margin | Evidence supports scale; otherwise narrow, iterate, or stop |
| Later | Evidence-dependent | Consider mainnet, licensed Open Banking, more markets, Teen or Kids | Separate business case and qualified human approval for each expansion |

## 6. Phase 1 — Evidence-ready beta

**Timing:** 13 October–30 November 2026

**Primary constraint:** trust and measurement

### Outcome 1: Publish a reproducible Devnet evidence package

**Deliverables**

- Add a `DEVNET_PROOF` record or public evidence panel with:
  - release or commit identifier,
  - transaction signature and Explorer link,
  - asset address,
  - expected and observed owner,
  - metadata URI or hash,
  - program or certificate standard actually used,
  - post-mint state snapshot,
  - transfer-behavior test,
  - independent RPC verification date.
- Add an issue register for failed, duplicate, or mismatched mints.
- Ensure mint retry behavior is idempotent.

**Target hypothesis**

- 100% of required evidence fields published for one named mint.
- At least 19 of 20 controlled Devnet mint attempts complete successfully without a duplicate asset.
- Zero owner mismatches in the controlled test set.

**Stop rule**

- Do not claim a specific standard, non-transferability, or mainnet readiness until the public evidence supports it.

### Outcome 2: Establish the production trust baseline

**Deliverables**

- Production authentication and versioned Terms, Privacy, educational-disclaimer, and blockchain-consent records.
- Data inventory, purpose and retention schedule, deletion flow, processor list, and incident-response owner.
- Threat model for account takeover, wallet phishing, prompt injection, sensitive logs, unauthorized minting, and duplicate certificates.
- Keyboard, screen-reader, text-scaling, contrast, reduced-motion, and voice/text-equivalence review of every critical journey.

**Target hypothesis**

- Zero unresolved critical security, privacy, accessibility, or consent defects at beta release.
- 100% of public-chain fields previewed before the wallet signs.
- 100% of critical voice content has a readable text equivalent.

**Stop rule**

- Pause public data collection or certificate issuance when a critical trust defect lacks an effective containment plan.

### Outcome 3: Instrument the core learning loop

**Deliverables**

- Versioned event taxonomy for Health Check start and completion, score unlock, first lesson, first action, quiz result, return activity, certificate eligibility, mint attempt, mint success, and consent state.
- Funnel and cohort views that separate product use, learning evidence, partner reach, waitlist entries, and paid seats.
- A pre-registered validation plan with population, hypothesis, measurement window, decision rule, and missing-data treatment.

**Target hypothesis**

- 100% of critical funnel events observable in a test environment.
- No quiz answer, free-text financial history, or sensitive amount is written to the public chain or analytics payload by default.

**Stop rule**

- Do not begin the validation cohort until event definitions and decision rules are frozen for that cycle.

## 7. Phase 2 — Adult product validation

**Timing:** December 2026–January 2027

**Scope:** one adult audience, one language, one learning problem

Recommended first problem: **building an emergency buffer and the habits that support it**.

### Outcome 1: Prove activation

Run a consented cohort of 30–50 adult testers through:

`Health Check → explanation → one lesson or scenario → one small action → visible progress`

**Internal target hypotheses — not public performance claims**

- At least 70% of people who start the Health Check complete it.
- At least 60% of people who unlock the result complete one meaningful learning action within the same session.
- Median time to the first meaningful action is under 10 minutes.

### Outcome 2: Measure learning and return behavior

**Internal target hypotheses**

- At least 30% of activated testers complete another learning action within seven days.
- The focused pre/post scenario shows a predefined improvement without claiming improved financial outcomes.
- At least 80% of testers understand that Mila is AI, the product is educational, and the wallet is optional.

### Outcome 3: Convert evidence into a product decision

Interview completers, drop-offs, and accessibility-tool users. Record one of four decisions: **scale, iterate, stop, or investigate**.

**Stop rule**

- If first-action completion remains below 40% after two bounded iterations, stop adding features and redesign the entry loop.
- Any repeated safety, privacy, or accessibility failure overrides growth targets.

## 8. Phase 3 — First paid B2B pilot

**Timing:** Q1 2027

**Commercial wedge:** one employer, school, university, foundation, bank, or fintech buyer

### Pilot shape

- Eight weeks.
- 50–200 learner seats.
- One audience and one learning outcome.
- Baseline Health Check, focused learning path, Mila support, accessibility, progress view, and sponsor outcomes report.
- Explicit exclusions: financial advice, financial-product recommendations, guaranteed savings, investing execution, and regulated suitability assessment.

### Required outcomes

1. Sign one pilot with approved scope, data roles, service levels, success criteria, support model, and price.
2. Measure **Paid Activated Learner Weeks (PALW)**: unique learners covered by a paid plan who complete at least one defined learning action during a week.
3. Deliver a sponsor report that separates seat allocation, activation, retention, learning evidence, support incidents, and partner reach.

### Internal target hypotheses

- At least 50% of allocated seats activate.
- At least 30% of activated learners contribute one or more PALW in week four.
- Zero severe safety or privacy incidents.
- Sponsor accepts the outcomes report and makes an explicit renew, expand, iterate, or stop decision.
- Pilot contribution margin is measured; scaling requires a credible path to positive contribution margin.

The initial price is an experiment requiring founder approval after the delivery-cost model and trust review are complete.

## 9. Phase 4 — White-label and PL/EU readiness

**Timing:** Q2 2027

### Outcome 1: One production-ready partner configuration

- Tenant and data-role model.
- Partner branding without sponsor control over learning criteria.
- Data isolation, export, deletion, support ownership, and service-level boundaries.
- Sponsor reporting that excludes private learner answers and financial details.

### Outcome 2: One jurisdiction-ready content set

- Versioned knowledge cards with primary sources, jurisdiction, audience, review date, risk level, and approved answer boundary.
- Polish translation reviewed for meaning, regulatory boundaries, and plain language rather than copied mechanically from US content.
- Change control for laws, source updates, corrections, and user notification.

### Outcome 3: Independent release gates

- Qualified legal and privacy review for the selected PL/EU deployment.
- Security review and recovery test.
- WCAG 2.2 AA review of critical journeys.
- Separate Kids or Teen decision; neither mode launches by default with the adult partner pilot.

**Stop rule**

- Do not expand to additional jurisdictions, regulated partners, Kids, or Teen modes while the first jurisdiction has unresolved legal, privacy, content, accessibility, or operational ownership gaps.

## 10. Phase 5 — Controlled scale

**Timing:** H2 2027

Scale only the audience, outcome, offer, and channel supported by evidence.

### Outcomes

1. Complete at least two comparable pilots and obtain at least one renewal or expansion decision.
2. Improve Day-30 retained learning activity and contribution margin without dark patterns, pressure mechanics, or weaker trust controls.
3. Establish production service monitoring, incident response, support SLAs, knowledge freshness, and a quarterly trust review.

### Decision rule

- **Scale:** repeatable demand, retained learner activity, accepted outcomes, and viable delivery economics.
- **Iterate:** demand exists but activation, retention, trust, or margin misses the predefined gate.
- **Stop:** the offer does not create enough learner or buyer value after bounded tests.
- **Investigate:** evidence is incomplete or conflicting.

## 11. Later-stage options

These are options, not commitments.

### Solana mainnet

Consider only when:

- Devnet reliability and the evidence register are proven over time,
- real users and partners value public certificate verification,
- key management, monitoring, cost controls, recovery, and incident response are independently reviewed,
- privacy and legal reviews approve the exact metadata and consent flow.

### Open Banking

- Begin with read-only account-information access through a licensed provider.
- Keep manual entry available.
- Require explicit consent, data minimization, strong authentication, retention limits, and a separate threat model.
- Do not introduce payment initiation or personalized product recommendations without a new business case and qualified review.

### Teen and Kids modes

- Parent- or guardian-controlled profile.
- Pre-approved content and safe narration.
- No wallet, public leaderboard, open AI chat, advertising, purchases, or direct notifications to children by default.
- Independent child-safety, privacy, legal, accessibility, and usability evidence before any pilot.

### Additional markets and languages

Expand one jurisdiction at a time. Each release requires jurisdiction-specific sources, translation review, content ownership, support readiness, and a measurable distribution case.

## 12. KPI framework

| Area | Primary measures |
|---|---|
| Demand | Qualified buyer conversations, qualified pipeline, pilot proposals, paid pilot revenue |
| Activation | Health Check completion, score unlock, first meaningful action, time to first action |
| Retention | Day-7 and Day-30 retained learning activity, PALW, cohort return by learning path |
| Learning | Pre/post scenario change, knowledge retention, correctly completed scenarios, completion-rule version |
| Trust | AI refusals, reported errors, corrections, consent completion, privacy incidents, accessibility defects |
| Solana | Mint success, confirmation time, duplicates, owner match, evidence-register completeness |
| Economics | AI/voice/infrastructure cost per activated learner, support cost, gross profit, contribution margin |
| Partner | Seat activation, sponsor report acceptance, renewal, expansion, support SLA performance |

All baselines are currently unknown unless a cited measurement report says otherwise. Targets in this roadmap are planning hypotheses and must not be presented as achieved results.

## 13. Ownership and approval queue

| Area | Accountable owner | Required approval or review |
|---|---|---|
| Product vision, audience, offer, pricing, public claims | Founder | Founder approval |
| Solana flow, evidence register, key management | Solana engineering | Security review; founder approval before mainnet |
| Learning experience and Mila behavior | Product and learning | Trust review before production change |
| Knowledge cards and financial content | Content owner | Subject-matter and jurisdiction review |
| Analytics and experiment decisions | Analytics owner | Privacy review for event data |
| B2B pilot, contract, data roles, sponsor report | Founder / commercial owner | Legal, privacy, security, and financial approval |
| Kids or Teen release | Product owner | Qualified child-safety, privacy, legal, and accessibility review |

## 14. Initial decision log

| Date | Decision | Reason |
|---|---|---|
| 13 Oct 2026 | Treat Adult / US / English / free as the controlled public MVP baseline | Separates the current product from planned market and audience expansion |
| 13 Oct 2026 | Record the Devnet flow as operating; keep a named mint pending until its reproducible evidence package is public | Preserves the confirmed product status without overstating independent verification |
| 13 Oct 2026 | Make product and learning evidence the dominant constraint | The next risk is unsupported scale, not lack of features |
| 13 Oct 2026 | Use one focused B2B paid pilot as the first commercial wedge | Creates a bounded path to willingness-to-pay and delivery-economics evidence |
| 13 Oct 2026 | Do not introduce a Coach FI token or tokenomics model | Blockchain is an optional proof layer, not the product purpose |

## 15. Roadmap governance

- Review metrics weekly during active validation and monthly otherwise.
- Next metric review: **20 October 2026**.
- Review the complete roadmap at the end of each phase.
- Every phase ends with a scale, iterate, stop, or investigate decision.
- Do not change a target after results are known; open a new experiment instead.
- Record material scope, claim, safety, data, and architecture decisions in the decision log.
- The founder approves external promises, pricing, spending, partnerships, production releases, and public outcome claims.

## Related documents

- [CoachFI AI White Paper — PDF](white-paper/CoachFI_AI_White_Paper_EN_v1.0.pdf)
- [Product Architecture](PRODUCT_ARCHITECTURE.md)
- [Distribution Rollout](DISTRIBUTION_ROLLOUT.md)
- [Launch QA Checklist](LAUNCH_QA_CHECKLIST.md)
- [Security and Privacy Baseline](SECURITY_PRIVACY.md)
