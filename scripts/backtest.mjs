// Coach FI — deterministic backtests for the learning/habit engine.
// Faithfully mirrors the production formulas so we can simulate behaviour over time:
//   - SM-2 scheduling      → lib/srs.ts  (calculateNext)
//   - Streak logic         → lib/streak.ts (markActiveToday)
//   - Stage unlock/complete→ lib/learningProgress.ts (getAllStageProgress)
// Run: node scripts/backtest.mjs
//
// NOTE: this is a simulation harness. It re-implements the exact formulas from the
// source (kept in sync by hand) because the TS modules are browser/localStorage-bound.

// ───────────────────────── SM-2 (verbatim from lib/srs.ts) ─────────────────────────
function calculateNext(card, correct) {
  const quality = correct ? 5 : 1;
  let { interval, repetitions, easeFactor } = card;
  if (correct) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    easeFactor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (easeFactor < 1.3) easeFactor = 1.3;
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }
  if (interval > 90) interval = 90; // MAX_INTERVAL_DAYS (mirrors lib/srs.ts)
  return { ...card, interval, repetitions, easeFactor };
}
function newCard(id) {
  return { id, interval: 1, repetitions: 0, easeFactor: 2.5, nextReviewDay: 0 };
}
function masteryLabel(reps) {
  if (reps === 0) return "New";
  if (reps === 1) return "Learning";
  if (reps <= 3) return "Familiar";
  if (reps <= 6) return "Practiced";
  return "Mastered";
}

// ───────────────────────── helpers ─────────────────────────
function pad(s, n) { return String(s).padEnd(n); }
function pct(n) { return (n * 100).toFixed(0) + "%"; }
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ════════════════════════ BACKTEST 1: SM-2 scheduling ════════════════════════
function backtestSrs(label, accuracy, days, seed) {
  const rand = mulberry32(seed);
  const NUM_QUESTIONS = 41; // current quiz bank size (see data/quizQuestions.ts)
  const MAX_NEW_PER_DAY = 5;
  const cards = new Map();
  let introduced = 0;
  let totalReviews = 0, correctReviews = 0, lapses = 0;

  for (let day = 0; day < days; day++) {
    // due cards first
    const due = [...cards.values()].filter((c) => c.nextReviewDay <= day);
    // then up to MAX_NEW_PER_DAY new cards
    let newToday = 0;
    while (introduced < NUM_QUESTIONS && newToday < MAX_NEW_PER_DAY) {
      const c = newCard("q" + introduced);
      cards.set(c.id, c);
      due.push(c);
      introduced++; newToday++;
    }
    for (const c of due) {
      const correct = rand() < accuracy;
      totalReviews++;
      if (correct) correctReviews++; else lapses++;
      const next = calculateNext(c, correct);
      next.nextReviewDay = day + next.interval;
      cards.set(c.id, next);
    }
  }

  const all = [...cards.values()];
  const buckets = { New: 0, Learning: 0, Familiar: 0, Practiced: 0, Mastered: 0 };
  let maxInterval = 0, sumInterval = 0;
  for (const c of all) {
    buckets[masteryLabel(c.repetitions)]++;
    maxInterval = Math.max(maxInterval, c.interval);
    sumInterval += c.interval;
  }
  console.log(`\n  ── ${label} (accuracy ${pct(accuracy)}, ${days} days) ──`);
  console.log(`  cards introduced : ${introduced}/${NUM_QUESTIONS}`);
  console.log(`  total reviews    : ${totalReviews}  (correct ${pct(correctReviews / totalReviews)}, lapses ${lapses})`);
  console.log(`  avg reviews/card : ${(totalReviews / introduced).toFixed(1)}`);
  console.log(`  interval (days)  : avg ${(sumInterval / all.length).toFixed(1)}, max ${maxInterval}`);
  console.log(`  mastery spread   : ` +
    Object.entries(buckets).map(([k, v]) => `${k} ${v}`).join("  "));
  return { buckets, maxInterval, totalReviews };
}

// ════════════════════════ BACKTEST 2: interval growth of one perfect card ════════════════════════
function backtestIntervalGrowth() {
  console.log("\n  ── interval growth, one card, always correct ──");
  let c = newCard("x");
  const seq = [];
  for (let i = 0; i < 8; i++) {
    c = calculateNext(c, true);
    seq.push(`r${c.repetitions}:${c.interval}d(EF ${c.easeFactor.toFixed(2)})`);
  }
  console.log("  " + seq.join("  →  "));
  // one lapse then recovery
  let d = newCard("y");
  for (let i = 0; i < 4; i++) d = calculateNext(d, true);
  const beforeEF = d.easeFactor, beforeInt = d.interval;
  d = calculateNext(d, false);
  console.log(`  lapse after r4: interval ${beforeInt}d→${d.interval}d, EF ${beforeEF.toFixed(2)}→${d.easeFactor.toFixed(2)}, reps→${d.repetitions}`);
}

// ════════════════════════ BACKTEST 3: streak logic (mirrors lib/streak.ts) ════════════════════════
function markActiveToday(state, dayIndex) {
  // mirrors lib/streak.ts computeStreak: gap 1–2 days continues (grace day), 3+ resets
  if (state.lastActiveDay === dayIndex) return state;
  const gap = state.lastActiveDay < 0 ? Infinity : dayIndex - state.lastActiveDay;
  const continues = gap >= 1 && gap <= 2;
  const current = continues ? state.currentStreak + 1 : 1;
  return {
    lastActiveDay: dayIndex,
    currentStreak: current,
    longestStreak: Math.max(current, state.longestStreak),
  };
}
function backtestStreak(label, activeDays, totalDays) {
  let state = { lastActiveDay: -999, currentStreak: 0, longestStreak: 0 };
  const activeSet = new Set(activeDays);
  for (let d = 0; d < totalDays; d++) {
    if (activeSet.has(d)) state = markActiveToday(state, d);
  }
  console.log(`  ${pad(label, 26)} current=${pad(state.currentStreak, 4)} longest=${state.longestStreak}`);
  return state;
}

// ════════════════════════ BACKTEST 4: stage unlock timeline ════════════════════════
function backtestStages() {
  // Stage sizes from lib/learningProgress.ts (STAGE_QUESTION_IDS)
  const stages = {
    "money-mindset": 5, "saving-habit": 6, "inflation": 6, "credit-rates": 6,
    "emergency-fund": 4, "long-term-investing": 9, "retirement": 3, "family-plan": 3,
  };
  console.log("\n  ── stage completion threshold (>=80% of questions answered once) ──");
  for (const [id, total] of Object.entries(stages)) {
    const needed = Math.ceil(total * 0.8);
    console.log(`  ${pad(id, 22)} ${total} questions → need ${needed} answered to mark "completed"`);
  }
}

// ───────────────────────── run ─────────────────────────
console.log("════════════ Coach FI backtests ════════════");
console.log("\n[1] SM-2 SCHEDULING SIMULATION");
backtestSrs("Diligent learner", 0.9, 30, 1);
backtestSrs("Diligent learner", 0.9, 90, 1);
backtestSrs("Struggling learner", 0.6, 90, 2);

console.log("\n[2] SM-2 INTERVAL GROWTH");
backtestIntervalGrowth();

console.log("\n[3] STREAK LOGIC");
const perfect = Array.from({ length: 70 }, (_, i) => i);
backtestStreak("Perfect 70 days", perfect, 70);
const missDay10 = perfect.filter((d) => d !== 10);
backtestStreak("One miss (day 10)", missDay10, 70);
const weekdaysOnly = perfect.filter((d) => d % 7 < 5);
backtestStreak("Weekdays only (skip wknd)", weekdaysOnly, 70);

console.log("\n[4] STAGE UNLOCK");
backtestStages();

console.log("\n════════════ done ════════════");
