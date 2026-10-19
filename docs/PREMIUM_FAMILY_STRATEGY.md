# Coach FI - Premium Family Product Strategy

Date: 2026-06-09

## 1. Strategic Reset

Coach FI should stop looking like a bundle of finance tools. The product should feel like a calm family financial coach:

**Free Financial Health Check -> account + terms -> personal score -> family plan -> voice coach trial -> premium habit system.**

The strongest acquisition hook is the free diagnosis. The strongest retention hook is the daily habit loop: Mila voice, short lessons, family challenges, coins, levels and visible progress.

## 2. Primary Customer

### Main ICP

Middle-class, upper-middle-class and wealthy households that have income but lack a system.

They often:

- earn enough to improve their future,
- spend too much on lifestyle, subscriptions, shopping and convenience,
- do not invest regularly,
- do not teach children money habits consistently,
- feel they "should be doing better" but avoid financial planning because it feels boring, stressful or judgmental.

### Secondary ICP

- Entrepreneurs and high-earning professionals with irregular income.
- Parents who want financial education for children.
- Beginner investors from Dorian's trading audience who need foundations before speculation.

### Not the public lead message

Debt rescue and crisis intervention should not be the first product impression for this audience. It remains important, but it should be:

- hidden from primary navigation,
- triggered by Financial Health Check red flags,
- available through a discreet "I need urgent help" path,
- potentially spun into a separate free emergency product later.

## 3. Free Diagnosis Funnel

### Step 1 - Free analysis without account

User can enter:

- household income range,
- monthly spending,
- savings cushion,
- investing habit,
- number of dependents / children,
- shopping impulse score,
- subscriptions and recurring costs,
- debt stress / safety flag.

Before login, Coach FI should show only a lightweight preview:

- "3 areas to check",
- one visible insight,
- reassurance that this is educational and not investment advice.

Do not show the final score yet.

### Step 2 - Account + terms gate

To unlock the score and plan, user must:

- create account or magic-link login,
- accept Terms,
- accept Privacy Policy,
- confirm that Coach FI is educational and not individual investment, legal or medical advice,
- optionally consent to marketing separately.

Keep the gate honest. Do not use fake urgency, hidden defaults, pre-checked marketing consent or confusing trial copy.

### Step 3 - Score + solution

After acceptance, show:

- Financial Health Score,
- top 3 leaks,
- 30-day action plan,
- recommended modules,
- "Try Mila Voice Coach" premium trial.

### Step 4 - Premium trial

The trial should prove the voice agent:

- 7 days,
- limited number of AI/voice coach sessions,
- limited receipt/invoice scans,
- full access to Kids Mode lessons,
- clear date when trial ends,
- clear price before starting paid subscription.

Recommended implementation language:

> "Trial gives you access to Mila Voice Coach and Family Plan. You will see the price and renewal date before payment. You can cancel any time from Account."

## 4. Pricing Architecture

Do not sell literal "unlimited AI" without cost controls. Public copy can say Premium has no daily learning limits, while Terms should define fair-use for voice, OCR and AI calls.

| Tier | Purpose | Access |
|---|---|---|
| Free Diagnosis | Acquisition | Health Check inputs, preview insight, one daily challenge, basic education. |
| Trial | Conversion | 7 days, limited AI/voice sessions, limited receipt scans, family onboarding. |
| Premium Family | Core paid product | Family plan, Kids Mode, daily challenges, receipt analysis, shopping hygiene, jars, progress, certificates, Mila voice without daily learning limits, with fair-use for abuse and cost protection. |
| Premium Voice Plus | Higher ARPU | More voice sessions, advanced coaching paths, multilingual lessons, priority voice generation, family profiles. |
| Emergency Free | Trust / impact | Crisis path, local support links, templates and safety guidance; not marketed as the main premium product. |

## 5. Product Architecture

### Primary modules

1. Financial Health Check
2. Personal Family Plan
3. Mila Voice Coach
4. Daily Challenge
5. Spending & Shopping Hygiene
6. Receipt / Invoice Analyzer
7. Family Kids Mode
8. Rewards, coins, certificates

### Hidden / conditional modules

Financial Crisis Plan and Job Recovery should appear only when:

- the user explicitly clicks "I need urgent help",
- Health Check score is very low,
- debt stress / no-liquidity answers are selected,
- user says they lost work/business.

### Data rules

- Store only what is necessary.
- Make account data export/delete-ready.
- Separate child profile data from adult profile data.
- Marketing consent must be separate from Terms acceptance.
- Receipt/invoice OCR should be opt-in and explain retention.
- Voice transcripts should have retention controls.

## 6. UX Principles

- Pastel, calm, premium-friendly palette.
- No red-alert interface unless crisis path is triggered.
- Use family-positive language: "plan", "future", "habits", "children", "calm control".
- Avoid shame language: no "you failed", "you are bad with money".
- Show one next action at a time.
- Make the first 10 seconds obvious: "Check your family's financial health."

## 7. Marketing Positioning

### Main promise

> Coach FI helps families turn income into a calm system: spend consciously, save automatically, invest with education and teach children money habits.

### Polish public hook

> Masz dochód, ale pieniądze znikają? Zrób darmową diagnozę zdrowia finansowego rodziny.

### English public hook

> You earn money. Coach FI helps your family turn it into a system.

### YouTube / trading channel bridge

Do not pitch Coach FI as trading. Pitch it as the foundation before trading:

- "Zanim zaczniesz trading, sprawdź zdrowie finansowe."
- "Najpierw poduszka, budżet i nawyki. Dopiero potem ryzyko."
- "Jeżeli nie kontrolujesz wydatków, trading będzie presją, nie strategią."

## 8. Campaign System

### Campaign 1 - Free Financial Health Score

Goal: lead generation.

Content:

- "Ile naprawdę zostaje z Twojego dochodu?"
- "Czy Twoja rodzina ma system finansowy?"
- "3 sygnały, że zarabiasz, ale nie budujesz majątku."

CTA:

> Zrób darmową diagnozę finansową.

### Campaign 2 - Mila Voice Coach

Goal: trial activation.

Content:

- Mila reads score.
- Mila explains one money leak.
- Mila gives one 30-day family action.

CTA:

> Przetestuj głosowego coacha przez 7 dni.

### Campaign 3 - Family & Kids

Goal: premium family conversion.

Content:

- "Jak nauczyć dziecko różnicy między potrzebą a zachcianką?"
- "Rodzinne wyzwanie: jeden dzień bez zakupów impulsywnych."
- "Słoiki dla dziecka i dorosłego."

CTA:

> Zbuduj rodzinny plan finansowy.

## 9. Critical Risks

| Risk | Mitigation |
|---|---|
| Product looks too broad | Hide crisis/partner/experimental modules from main nav. |
| Premium AI costs explode | Trial limits, fair-use, caching common lessons, TTS reuse. |
| Users fear judgment | Calm language and "small next step" UX. |
| Legal/privacy friction | Clear consent, no prechecked marketing, export/delete path. |
| Kids safety | Parent gate, no wallet, no free-form AI for children. |
| "Financial advice" risk | Educational framing, no personalized investment recommendations, human adviser disclaimer. |
| Dark-pattern risk in trial | Clear trial end date, price, cancellation route and renewal consent. |

## 10. Decision

For public launch, build around this hierarchy:

1. Free Financial Health Check.
2. Family score and 30-day plan.
3. Mila Voice Coach trial.
4. Premium Family subscription.
5. Emergency path as hidden free support.

This is sharper than promoting every module equally.

## Sources To Review Before Launch

- GUS household budgets data: https://stat.gov.pl/en/topics/living-conditions/living-conditions/household-budget-survey-in-2024%2C2%2C20.html
- GUS household situation release: https://stat.gov.pl/en/topics/living-conditions/living-conditions/the-situation-of-households-in-2024-on-the-basis-of-results-of-the-household-budget-survey%2C12%2C24.html
- UODO guidance for children under 16: https://uodo.gov.pl/pl/493/2261
- UOKiK dark-pattern and subscription guidance: https://uokik.gov.pl/en/icpen-sweep-finds-majority-of-websites-and-mobile-apps-use-dark-patterns-in-the-marketing-of-subscription-services
- EU AI Act overview and AI literacy timeline: https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai
