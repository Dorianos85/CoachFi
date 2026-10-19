# Coach FI — Learning Science & Habit Formation (research basis)

> Evidence base for *how* Coach FI teaches and builds daily habits — the engine behind the
> Daily Challenge → Quiz → Mila → Coins → Streak loop. Pairs with `docs/FINANCIAL_KNOWLEDGE_BASE.md`
> (the *what*). Sources are peer-reviewed studies / meta-analyses where possible.

---

## Part 1 — How to learn & retain fastest

### The two techniques that actually win
- **Dunlosky et al. (2013)** reviewed 10 popular study techniques and rated only **two as "high
  utility": practice testing (retrieval) and distributed (spaced) practice.** Re-reading,
  highlighting and summarising scored *low*.
- **Hattie & Donoghue (2021)** meta-analysis (242 studies, ~169,000 participants) reached the same
  conclusion: the most effective techniques are **distributed practice and practice testing**.
- Takeaway: the things that *feel* productive (re-reading, highlighting) mostly create an **illusion
  of mastery**. The things that work feel harder.

### 1. Retrieval practice (the "testing effect")
- **Roediger & Karpicke (2006)**: actively *retrieving* information strengthens memory far more than
  re-studying it — **even with no feedback**. On delayed tests (days/weeks later) prior testing beats
  prior studying.
- **Multiple tests slow forgetting more than a single test**; alternating study + test is best.
- **Recall beats recognition**: producing the answer (free recall / short answer) builds stronger
  memory than picking from options (multiple choice). → opportunity for a recall-mode flashcard.

### 2. Spacing & the forgetting curve
- **Ebbinghaus**: without review we forget roughly **half within days and up to ~80% within weeks**.
- **Spacing effect**: spreading study over time beats cramming — studies show **~25% higher retention**
  over intervals of 4+ weeks vs massed practice.
- **Practical review schedule** for new material: a review **within ~1 hour**, again **within 24h**,
  then **within a week**, then **within a month** — expanding intervals.

### 3. Interleaving & "desirable difficulties"
- **Bjork**: spacing, interleaving and retrieval are **desirable difficulties** — they feel harder and
  slower, which is exactly why they work better long-term.
- **Interleaving** (mixing topics, ABC/ABC) beats **blocking** (AAA/BBB) for transfer. One study:
  **63% correct on a delayed test for interleaved vs 20% for blocked**. It forces you to *discriminate*
  which method a problem needs — the real-world skill.

### How Coach FI applies Part 1
| Principle | Coach FI mechanism | Status / opportunity |
|---|---|---|
| Spaced practice | **SM-2 algorithm** (`lib/srs.ts`) schedules expanding review intervals | ✅ core engine |
| Retrieval practice | Quiz + Review require recalling the answer | ✅ already retrieval-based |
| Forgetting curve | Due-card logic resurfaces items before they're forgotten | ✅ matches the curve |
| Interleaving | Quiz pulls **random questions across categories**, not one topic at a time | ✅ already interleaved |
| Recall > recognition | Quiz is multiple-choice (recognition) | 💡 add an optional free-recall flashcard mode |
| 1h / 24h first reviews | SM-2 first interval is 1 day | 💡 add a same-session + 24h "early review" for brand-new cards |

---

## Part 2 — How to build the habit

### How long it really takes
- **Lally et al. (2010)** — 96 people, a new daily behaviour for 84 days: automaticity plateaued on
  average at **~66 days** (range **18–254**, depending on how complex the behaviour is). The popular
  **"21 days" is a myth.**
- **Missing a single day did not meaningfully hurt** habit formation → streaks should *forgive* the
  occasional miss rather than punish it.
- Simpler actions automate faster than elaborate ones → keep the daily action **tiny**.

### The habit loop
- **Cue → Routine → Reward** (Duhigg; **Wendy Wood**). Wood's key finding: **context stability** — a
  consistent cue/time/place — is the invisible force behind habits.

### BJ Fogg's Behavior Model
- **B = MAP**: a Behavior happens when **Motivation, Ability and a Prompt** converge.
- Design moves:
  1. **Shrink the behavior** to raise Ability ("read one card", not "study for an hour").
  2. **Anchor** the new habit to an existing reliable routine (the Prompt).
  3. **Celebrate immediately** — a quick positive emotion is what wires the habit in (the reward).

### Implementation intentions (if-then plans)
- **Gollwitzer & Sheeran (2006)** meta-analysis (94 studies): turning a goal into an **if-then plan**
  — *"When situation X arises, I will do Y"* — has a **medium-to-large effect (d ≈ 0.65)** on actually
  doing it. It delegates the action to an environmental cue instead of relying on willpower.
- Effect is **larger** when the plan is explicitly if-then *and* the person is motivated.

### How Coach FI applies Part 2
| Principle | Coach FI mechanism | Status / opportunity |
|---|---|---|
| Habit loop (cue→routine→reward) | **Daily Challenge** (cue) → answer (routine) → **coins + streak** (reward) | ✅ full loop exists |
| ~66 days to automaticity | Streak counter (`lib/streak.ts`) | 💡 add a **66-day** milestone/badge, not just 7/30 |
| Forgive a missed day | Streak resets after a gap | 💡 add a **streak freeze / grace day** so one miss ≠ failure |
| Tiny behaviour | One question per day | ✅ already minimal |
| Context stability | Same daily cue | 💡 let users pick a **fixed daily time**; remind at it |
| Immediate celebration | Success message + token animation | ✅ keep it instant and visible |
| Implementation intentions | Onboarding goal field | 💡 capture an **if-then plan** ("After my morning coffee, I'll do one Coach FI question") and surface it in reminders |
| At-risk nudge | `isStreakAtRisk()` prompts after 18:00 | ✅ good cue; tie to the user's chosen time |

---

## One-paragraph version for Mila / marketing

> "The fastest way to actually *keep* what you learn isn't re-reading — it's **recalling** it and
> **spacing** the reviews out over time (that's exactly what Coach FI's daily quiz does). And the fastest
> way to make it stick as a habit is to keep the daily action **tiny**, **anchor it to something you
> already do**, and **celebrate the moment you finish**. Habits take around **66 days** to feel
> automatic — so a missed day is normal; just don't miss twice."

---

## Sources

- Dunlosky, Rawson, Marsh, Nathan & Willingham (2013), *Improving Students' Learning…* — high-utility
  techniques: https://pcl.sitehost.iu.edu/rgoldsto/courses/dunloskyimproving.pdf
- Hattie & Donoghue (2021) learning-strategies meta-analysis (summary): https://www.structural-learning.com/post/retrieval-and-spaced-practice
- Roediger & Karpicke (2006), *The Power of Testing Memory*, Perspectives on Psychological Science:
  http://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-Karpicke-2006_PPS.pdf
- Karpicke & Roediger (2008), *Repeated retrieval during learning…* (JML):
  https://learninglab.psych.purdue.edu/downloads/2007/2007_Karpicke_Roediger_JML.pdf
- Ebbinghaus forgetting curve & spacing effect (overview): https://en.wikipedia.org/wiki/Spacing_effect
- Distributed practice meta-analysis (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC12189222/
- Bjork & Bjork (2019/2011), *Desirable Difficulties*: https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf
- Lally, van Jaarsveld, Potts & Wardle (2010), *How are habits formed*, European Journal of Social
  Psychology: https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674
- Lally & Gardner — *Making health habitual* (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/
- Gollwitzer & Sheeran (2006), *Implementation Intentions and Goal Achievement: A Meta-Analysis*:
  https://www.prospectivepsych.org/sites/default/files/pictures/Gollwitzer_Implementation-intentions-1999.pdf
- BJ Fogg, *Tiny Habits* / Fogg Behavior Model (B=MAP): https://behaviormodel.org/
- Wendy Wood, *Good Habits, Bad Habits* — context & habit research (USC): https://dornsife.usc.edu/wendy-wood/

_Last researched & compiled: 2026-06._
