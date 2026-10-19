import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const stubs = vi.hoisted(() => ({
  effects: [] as (() => unknown)[],
  visible: vi.fn(),
  LegacyAuth: vi.fn(), CdpAuth: vi.fn(), AccountSync: vi.fn(),
  Language: vi.fn(), Streak: vi.fn(), Voice: vi.fn(), Consent: vi.fn(), Mode: vi.fn(),
  SignInGate: vi.fn(), Boundary: vi.fn(),
}));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (callback: () => unknown) => { stubs.effects.push(callback); },
}));
vi.mock("@coinbase/cdp-react/components/CDPReactProvider", () => ({ CDPReactProvider: stubs.CdpAuth }));
vi.mock("@/context/AuthContext", () => ({ AuthProvider: stubs.LegacyAuth }));
vi.mock("@/components/AccountSync", () => ({ AccountSync: stubs.AccountSync }));
vi.mock("@/components/SignInGate", () => ({ SignInGate: stubs.SignInGate }));
vi.mock("@/components/ProductScopeBoundary", () => ({ ProductScopeBoundary: stubs.Boundary }));
vi.mock("@/context/LanguageContext", () => ({ LanguageProvider: stubs.Language }));
vi.mock("@/context/StreakContext", () => ({ StreakProvider: stubs.Streak }));
vi.mock("@/context/VoiceContext", () => ({ VoiceProvider: stubs.Voice }));
vi.mock("@/context/ConsentContext", () => ({ ConsentProvider: stubs.Consent }));
vi.mock("@/context/ModeContext", () => ({ ModeProvider: stubs.Mode }));
vi.mock("@/lib/progress-visibility", () => ({ setProgressVisible: stubs.visible }));

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as ReactElement<Record<string, unknown>>;
  return [element, ...elements(element.props.children as ReactNode)];
}
beforeEach(() => { vi.resetModules(); vi.clearAllMocks(); stubs.effects.length = 0; });
afterEach(() => { vi.unstubAllEnvs(); });

describe("one account backend per provider branch", () => {
  it("disables the legacy auth provider when CDP owns account sync", async () => {
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", "synthetic-project");
    const { Providers } = await import("@/app/providers");
    const tree = elements(Providers({ children: "synthetic child" }));
    expect(tree.find((element) => element.type === stubs.LegacyAuth)?.props.enabled).toBe(false);
    expect(tree.filter((element) => element.type === stubs.CdpAuth)).toHaveLength(1);
    expect(tree.filter((element) => element.type === stubs.AccountSync)).toHaveLength(1);
    const boundary = tree.find((element) => element.type === stubs.Boundary)!;
    const personal = elements(boundary.props.children as ReactNode);
    expect(personal.some(element => element.type === stubs.AccountSync || element.type === stubs.LegacyAuth || element.type === stubs.CdpAuth)).toBe(false);
    expect(personal.some(element => element.type === stubs.Consent)).toBe(true);
    expect(personal.some(element => element.type === stubs.SignInGate)).toBe(true);
    for (const effect of stubs.effects) effect();
    expect(stubs.visible).not.toHaveBeenCalled();
  });
  it.each(["", "  "])("keeps local/legacy fallback without mounting CDP for empty configuration %j", async (projectId) => {
    vi.stubEnv("NEXT_PUBLIC_CDP_PROJECT_ID", projectId);
    const { Providers } = await import("@/app/providers");
    const tree = elements(Providers({ children: "synthetic child" }));
    expect(tree.find((element) => element.type === stubs.LegacyAuth)?.props.enabled).toBe(true);
    expect(tree.some((element) => element.type === stubs.CdpAuth || element.type === stubs.AccountSync)).toBe(false);
    for (const effect of stubs.effects) effect();
    expect(stubs.visible).toHaveBeenCalledWith(true);
  });
});
