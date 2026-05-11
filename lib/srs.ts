// SM-2 spaced repetition algorithm (simplified, same core as Duolingo/Anki)

const SRS_KEY = "coachfi-srs";
const MAX_NEW_PER_DAY = 5;

export interface SRSCard {
  id: string;
  interval: number;       // days until next review
  nextReview: string;     // YYYY-MM-DD
  repetitions: number;    // consecutive correct answers
  easeFactor: number;     // difficulty multiplier (min 1.3)
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

// SM-2 core: quality 5=perfect, 3=correct-but-hard, 0=complete-blackout
export function calculateNext(card: SRSCard, correct: boolean): SRSCard {
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

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return { ...card, interval, repetitions, easeFactor, nextReview: next.toISOString().split("T")[0] };
}

export function getAllCards(): SRSCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SRS_KEY);
    return raw ? (JSON.parse(raw) as SRSCard[]) : [];
  } catch { return []; }
}

export function saveCards(cards: SRSCard[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SRS_KEY, JSON.stringify(cards));
}

export function getCardById(id: string): SRSCard | undefined {
  return getAllCards().find((c) => c.id === id);
}

function newCard(id: string): SRSCard {
  return { id, interval: 1, nextReview: today(), repetitions: 0, easeFactor: 2.5 };
}

// Returns IDs of questions that need review today (due or never seen)
export function getDueIds(allIds: string[]): string[] {
  const t = today();
  const cards = getAllCards();
  const allowedIds = new Set(allIds);
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  const due = cards.filter((c) => allowedIds.has(c.id) && c.nextReview <= t).map((c) => c.id);
  const neverSeen = allIds.filter((id) => !cardMap.has(id)).slice(0, MAX_NEW_PER_DAY);

  // Due first, then new cards (avoid duplicates)
  const seen = new Set(due);
  const combined = [...due, ...neverSeen.filter((id) => !seen.has(id))];
  return combined;
}

export function getDueCount(allIds: string[]): number {
  return getDueIds(allIds).length;
}

// Record an answer; creates or updates SRS card
export function recordAnswer(id: string, correct: boolean): SRSCard {
  const cards = getAllCards();
  const existing = cards.find((c) => c.id === id) ?? newCard(id);
  const updated = calculateNext(existing, correct);
  saveCards([...cards.filter((c) => c.id !== id), updated]);
  return updated;
}

// Human-readable interval label
export function intervalLabel(card: SRSCard): string {
  if (card.repetitions === 0) return "new";
  if (card.interval === 1) return "tomorrow";
  if (card.interval < 7) return `${card.interval} days`;
  if (card.interval < 30) return `${Math.round(card.interval / 7)}w`;
  return `${Math.round(card.interval / 30)}mo`;
}

// Mastery level 0–4 based on repetitions
export function masteryLevel(card: SRSCard): 0 | 1 | 2 | 3 | 4 {
  if (card.repetitions === 0) return 0;
  if (card.repetitions === 1) return 1;
  if (card.repetitions <= 3) return 2;
  if (card.repetitions <= 6) return 3;
  return 4;
}
