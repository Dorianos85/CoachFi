import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { createLearningPaths, transitionLearningPaths, type LearningPathMutation, type LearningPaths } from "@/lib/learning-paths";
import { FAMILY_CORRECT_ANSWER, FAMILY_EXAMPLE, familyLearningContent } from "@/lib/family-learning-content";

const fixture = vi.hoisted(() => ({
  locale: "pl", requiredAccepted: true, adult: true, loaded: true,
  paths: null as unknown as LearningPaths, mutations: [] as LearningPathMutation[],
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));
vi.mock("@/context/ConsentContext", () => ({ useConsent: () => ({ loaded: fixture.loaded, requiredAccepted: fixture.requiredAccepted, openSettings: vi.fn() }) }));
vi.mock("@/context/ModeContext", () => ({ useMode: () => ({ loaded: fixture.loaded, modeRecord: fixture.adult ? { mode: "adult", adultAgeRequirement: 18, selectedAt: "2026-01-01T00:00:00.000Z", adultConfirmedAt: "2026-01-01T00:00:00.000Z" } : null }) }));
vi.mock("@/context/LearningPathsContext", () => ({ useLearningPaths: () => {
  const mutate = (mutation: LearningPathMutation) => {
    fixture.mutations.push(mutation);
    fixture.paths = transitionLearningPaths(fixture.paths, mutation);
  };
  return {
    paths: fixture.paths,
    chooseGoal: (segment: "adult" | "family", goal: "needs" | "shared-goal") => mutate({ type: "goal", segment, goal }),
    markLessonRead: (segment: "adult" | "family") => mutate({ type: "lesson", segment }),
    answerQuestion: (segment: "adult" | "family", answer: "a" | "b" | "c") => mutate({ type: "answer", segment, answer }),
    markActionPlanned: (segment: "adult" | "family") => mutate({ type: "action", segment }),
  };
} }));

import { FamilyLearningPath } from "@/components/family/FamilyLearningPath";

type Node = ReactElement<Record<string, unknown>>;
function walk(node: ReactNode): Node[] {
  if (Array.isArray(node)) return node.flatMap(walk);
  if (!isValidElement(node)) return [];
  const element = node as Node;
  return [element, ...walk(element.props.children as ReactNode)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return isValidElement(node) ? text((node as Node).props.children as ReactNode) : "";
}
function render() { return FamilyLearningPath(); }
function clickByText(label: string) {
  const node = walk(render()).find(element => typeof element.props.onClick === "function" && text(element).includes(label));
  expect(node, `control ${label}`).toBeDefined();
  expect(node!.props.disabled).not.toBe(true);
  (node!.props.onClick as () => void)();
}
function submitAnswer(answer: string) {
  const form = walk(render()).find(element => element.type === "form");
  expect(form).toBeDefined();
  const Original = globalThis.FormData;
  class SyntheticFormData { get() { return answer; } }
  vi.stubGlobal("FormData", SyntheticFormData);
  try { (form!.props.onSubmit as (event: unknown) => void)({ preventDefault: vi.fn(), currentTarget: {} }); }
  finally { vi.stubGlobal("FormData", Original); }
}

beforeEach(() => {
  fixture.paths = createLearningPaths(); fixture.locale = "pl";
  fixture.requiredAccepted = true; fixture.adult = true; fixture.loaded = true; fixture.mutations = [];
});

describe("parent-led family path: actual element handlers and real local state transitions", () => {
  it("uses the fixed PLN example with one correct answer and accounts for all uses", () => {
    expect(FAMILY_EXAMPLE).toEqual({ available: 40, necessary: 20, setAside: 10, optional: 10, currency: "PLN" });
    expect(40 - 20 - 10).toBe(10);
    expect(FAMILY_CORRECT_ANSWER).toBe("b");
    for (const locale of ["pl", "en"] as const) {
      const content = familyLearningContent[locale];
      expect(content.quizOptions).toEqual({ a: "20 PLN", b: "10 PLN", c: "30 PLN" });
      expect(content.quizExplanations.a).toContain("40 − 20");
      expect(content.quizExplanations.b).toContain("40 − 20 − 10 = 10 PLN");
      expect(content.quizExplanations.c).toContain("40 − 10");
    }
  });

  it.each(["pl", "en"])("shows only family focus choices before a topic, no personal-data fields (%s)", locale => {
    fixture.locale = locale;
    const tree = render(), nodes = walk(tree);
    expect(tree.type).toBe("div");
    expect(nodes.filter(node => node.type === "main")).toHaveLength(0);
    expect(nodes.filter(node => node.type === "input" || node.type === "textarea" || node.type === "select")).toHaveLength(0);
    expect(nodes.filter(node => node.props["aria-pressed"] === false)).toHaveLength(2);
    expect(nodes.filter(node => node.type === "form")).toHaveLength(0);
    expect(nodes.find(node => node.type === "progress")?.props.value).toBe(0);
    expect(text(tree)).not.toContain("4000");
    expect(nodes.filter(node => node.props.href === "/health" || node.props.href === "/adult/dashboard")).toHaveLength(0);
  });

  it.each(["pl", "en"])("preserves adult state while completing a family lesson, retry and plan (%s)", locale => {
    fixture.locale = locale;
    fixture.paths = { ...fixture.paths, adult: { goal: "reserve", lessonRead: true, answer: "b", actionPlanned: true } };
    const adult = fixture.paths.adult;
    const copy = familyLearningContent[locale as "pl" | "en"];
    clickByText(copy.goals.needs.title);
    expect(walk(render()).find(node => node.type === "progress")?.props.value).toBe(1);
    expect(walk(render()).filter(node => node.type === "form")).toHaveLength(0);
    clickByText(copy.readButton);
    const radios = walk(render()).filter(node => node.type === "input");
    expect(radios).toHaveLength(3);
    expect(radios.every(node => node.props.type === "radio" && node.props.name === "family-answer")).toBe(true);
    submitAnswer("a");
    expect(text(render())).toContain(copy.quizExplanations.a);
    expect(text(render())).toContain(copy.actionLocked);
    submitAnswer("b");
    expect(text(render())).toContain(copy.quizExplanations.b);
    expect(text(render())).toContain(copy.goals.needs.actionTitle);
    clickByText(copy.actionButton);
    expect(fixture.paths.family).toEqual({ goal: "needs", lessonRead: true, answer: "b", actionPlanned: true });
    expect(walk(render()).find(node => node.type === "progress")?.props.value).toBe(4);
    expect(text(render())).toContain(copy.actionDisclosure);
    expect(fixture.paths.adult).toBe(adult);
    expect(fixture.mutations.every(mutation => mutation.segment === "family")).toBe(true);
  });

  it("changes goal with a fresh lesson and distinct parent conversation/action, retaining adult progress", () => {
    const copy = familyLearningContent.pl;
    fixture.paths.family = { goal: "needs", lessonRead: true, answer: "b", actionPlanned: true };
    const adult = fixture.paths.adult;
    clickByText(copy.goals["shared-goal"].title);
    expect(fixture.paths.family).toEqual({ goal: "shared-goal", lessonRead: false, answer: null, actionPlanned: false });
    const output = text(render());
    expect(output).toContain(copy.goals["shared-goal"].lessonLead);
    expect(output).toContain(copy.goals["shared-goal"].conversation[1]);
    expect(output).not.toContain(copy.goals.needs.lessonTitle);
    clickByText(copy.readButton); submitAnswer("b");
    expect(text(render())).toContain(copy.goals["shared-goal"].actionTitle);
    expect(fixture.paths.adult).toBe(adult);
  });

  it.each(["consent", "adult", "loading"])("blocks all goal mutations before readiness: %s", missing => {
    if (missing === "consent") fixture.requiredAccepted = false;
    if (missing === "adult") fixture.adult = false;
    if (missing === "loading") fixture.loaded = false;
    const goals = walk(render()).filter(node => typeof node.props["aria-pressed"] === "boolean");
    expect(goals).toHaveLength(2);
    for (const goal of goals) {
      expect(goal.props.disabled).toBe(true);
      (goal.props.onClick as () => void)();
    }
    expect(fixture.mutations).toHaveLength(0);
    expect(fixture.paths.family.goal).toBeNull();
  });

  it("does not accept an unrecognised answer or offer free-text answers", () => {
    fixture.paths.family = { goal: "needs", lessonRead: true, answer: null, actionPlanned: false };
    submitAnswer("private text");
    expect(fixture.mutations).toHaveLength(0);
    expect(fixture.paths.family.answer).toBeNull();
    expect(walk(render()).filter(node => node.type === "textarea" || (node.type === "input" && node.props.type !== "radio"))).toHaveLength(0);
  });
});
