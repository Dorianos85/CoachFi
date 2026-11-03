/**
 * Server-side sanitiser for the chat history a browser sends to /api/chat.
 *
 * The client owns the transcript, so every "assistant" turn is untrusted: an attacker can put
 * words in Mila's mouth (fake prior agreement, many-shot jailbreaks). We cannot verify the turns
 * without a signed transcript, so we bound what they can do:
 * - only `user` / `assistant` roles are accepted; anything else (system, tool, developer…) rejects
 *   the whole request,
 * - only the last `maxTurns` turns are kept, each capped in length, plus a total size cap,
 * - the history must start with a user turn and strictly alternate, so at most half of the
 *   (already short) window can be forged assistant text.
 */

export type ChatRole = "user" | "assistant";
export type ChatTurn = { role: ChatRole; content: string };

export const CHAT_HISTORY_LIMITS = {
  /** Upper bound on raw items (the /coach page sends its whole transcript); more is treated as abuse. */
  maxRawItems: 200,
  maxTurns: 6,
  maxUserChars: 800,
  maxAssistantChars: 1600,
  maxTotalChars: 4000,
  maxMessageChars: 800,
} as const;

export class ChatHistoryError extends Error {}

type Limits = typeof CHAT_HISTORY_LIMITS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeChatHistory(raw: unknown, limits: Limits = CHAT_HISTORY_LIMITS): ChatTurn[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new ChatHistoryError("History must be an array");
  if (raw.length > limits.maxRawItems) throw new ChatHistoryError("History too long");

  const turns: ChatTurn[] = raw.map((item) => {
    if (!isRecord(item)) throw new ChatHistoryError("Invalid history item");
    const { role, content } = item;
    if (role !== "user" && role !== "assistant") throw new ChatHistoryError("Invalid history role");
    if (typeof content !== "string") throw new ChatHistoryError("Invalid history content");
    return { role, content: content.trim() };
  });

  const capped = turns
    .slice(-limits.maxTurns)
    .filter((turn) => {
      if (!turn.content) return false;
      const max = turn.role === "user" ? limits.maxUserChars : limits.maxAssistantChars;
      return turn.content.length <= max;
    });

  // Start with a user turn and strictly alternate; drop turns that break the pattern.
  const alternating: ChatTurn[] = [];
  for (const turn of capped) {
    const expected: ChatRole = alternating.length === 0 || alternating[alternating.length - 1].role === "assistant" ? "user" : "assistant";
    if (turn.role === expected) alternating.push(turn);
  }
  // The next message is the user's, so the history has to end with Mila's reply.
  if (alternating.length > 0 && alternating[alternating.length - 1].role === "user") alternating.pop();

  // Total size cap: drop oldest user+assistant pairs until it fits.
  let total = alternating.reduce((sum, turn) => sum + turn.content.length, 0);
  while (alternating.length > 0 && total > limits.maxTotalChars) {
    const removed = alternating.splice(0, 2);
    total -= removed.reduce((sum, turn) => sum + turn.content.length, 0);
  }
  return alternating;
}

export function sanitizeChatMessage(raw: unknown, limits: Limits = CHAT_HISTORY_LIMITS) {
  if (typeof raw !== "string") return null;
  const message = raw.trim();
  if (!message || message.length > limits.maxMessageChars) return null;
  return message;
}
