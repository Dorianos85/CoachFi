import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement, ReactNode } from "react";

const fixture = vi.hoisted(() => ({ locale: "pl", effects: [] as Array<() => unknown>,
  memoDeps: undefined as undefined | readonly unknown[], memoValue: undefined as unknown }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useEffect: (effect: () => unknown) => { fixture.effects.push(effect); },
  useMemo: (factory: () => unknown, deps: readonly unknown[]) => {
    if (!fixture.memoDeps || deps.length !== fixture.memoDeps.length || deps.some((value, index) => !Object.is(value, fixture.memoDeps![index]))) {
      fixture.memoValue = factory(); fixture.memoDeps = deps;
    }
    return fixture.memoValue;
  },
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: fixture.locale }) }));

beforeEach(() => {
  vi.resetModules(); fixture.locale = "pl"; fixture.effects.length = 0;
  fixture.memoDeps = undefined; fixture.memoValue = undefined;
  const data = new Map<string, string>();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) },
    sessionStorage: { getItem: () => null, setItem: vi.fn(), removeItem: vi.fn() }, dispatchEvent: vi.fn() });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join("");
  if (node && typeof node === "object" && "props" in node) return text((node as ReactElement<{children: ReactNode}>).props.children);
  return typeof node === "string" ? node : "";
}
describe("B14 scope boundary and captured render handles", () => {
  it("withholds personal children while configured identity is unknown in both languages", async () => {
    const store = await import("@/lib/product-storage"); store.initializeStorageOwnership(true);
    const { ProductScopeBoundary } = await import("@/components/ProductScopeBoundary");
    expect(text(ProductScopeBoundary({ children: "FIXTURE_PRIVATE_CONTENT" }))).toBe("Ustalamy dostęp do danych na tym urządzeniu…");
    fixture.locale = "en";
    expect(text(ProductScopeBoundary({ children: "FIXTURE_PRIVATE_CONTENT" }))).toBe("Preparing access to data on this device…");
  });

  it("keys personal content by owner epoch and marks known unavailable account as local only", async () => {
    const store = await import("@/lib/product-storage"), { ProductScopeBoundary } = await import("@/components/ProductScopeBoundary");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }); a.publishReady({ localOnly: true });
    const renderedA = ProductScopeBoundary({ children: "FIXTURE_CHILD" });
    expect(renderedA.key).toBe(String(a.revision)); expect(text(renderedA)).toContain("Synchronizacja jest obecnie niedostępna.");
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }); b.publishReady();
    const renderedB = ProductScopeBoundary({ children: "FIXTURE_CHILD" });
    expect(renderedB.key).toBe(String(b.revision)); expect(renderedB.key).not.toBe(renderedA.key);
    expect(text(renderedB)).toBe("FIXTURE_CHILD");
  });

  it("a handle captured by an old render cannot read or write a later render's owner", async () => {
    const store = await import("@/lib/product-storage"), { useProductStorage } = await import("@/lib/use-product-storage");
    store.beginStorageOwner({ kind: "guest" }).publishReady();
    const old = useProductStorage(); old.storage.setItem("coachfi-tokens", "321");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }); a.publishReady();
    const current = useProductStorage();
    expect(old.storage.isCurrent()).toBe(false); expect(old.storage.setItem("coachfi-tokens", "999")).toBe(false);
    expect(current.storage.getItem("coachfi-tokens")).toBeNull();
    expect(current.sessionStorage.area).toBe("session");
    expect(store.getStorageOwnershipServerSnapshot()).toBe(store.getStorageOwnershipServerSnapshot());
    expect(store.getStorageOwnershipServerSnapshot().status).toBe("pending");
  });

  it("partial deletion error remains visible outside the unmounted personal content", async () => {
    const store = await import("@/lib/product-storage"), { ProductScopeBoundary } = await import("@/components/ProductScopeBoundary");
    store.beginStorageOwner({ kind: "guest" }).publishReady();
    vi.spyOn(window.localStorage, "removeItem").mockImplementation(() => { throw new Error("FIXTURE_BLOCKED"); });
    expect(() => store.eraseCurrentPersonalData(store.captureCurrentPersonalStorage())).toThrow("FIXTURE_BLOCKED");
    expect(store.getStorageOwnershipSnapshot().failure).toBe("erase-failed");
    const view = ProductScopeBoundary({ children: "FIXTURE_PRIVATE" });
    expect(view.props.role).toBe("alert"); expect(text(view)).toContain("Część danych mogła zostać usunięta.");
    expect(text(view)).not.toContain("FIXTURE_PRIVATE");
    fixture.locale = "en";
    expect(text(ProductScopeBoundary({ children: "FIXTURE_PRIVATE" }))).toContain("Sync has been stopped.");
  });

  it("keeps captured handles stable when only same-owner availability metadata changes", async () => {
    const store = await import("@/lib/product-storage"), { useProductStorage } = await import("@/lib/use-product-storage");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" }); a.publishReady({ localOnly: true });
    const local = useProductStorage(); a.publishReady({ localOnly: false });
    const synced = useProductStorage();
    expect(synced.snapshot).not.toBe(local.snapshot); expect(synced.snapshot.localOnly).toBe(false);
    expect(synced.storage).toBe(local.storage); expect(synced.sessionStorage).toBe(local.sessionStorage);
    expect(local.storage.isCurrent()).toBe(true);
  });
  it.each(["pl", "en"])("B15 %s copy separates read-only view and unconfirmed changes without remounting", async locale => {
    fixture.locale = locale;
    const store = await import("@/lib/product-storage"), { useProductStorage } = await import("@/lib/use-product-storage");
    const { ProductScopeBoundary } = await import("@/components/ProductScopeBoundary");
    const lease = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    lease.publishReady({ localOnly: true, syncIssue: "read-only" });
    const before = useProductStorage(); const readOnly = ProductScopeBoundary({ children: "FIXTURE_FORM" });
    expect(text(readOnly)).toContain(locale === "pl" ? "Zmiany zapisujemy tylko na tym urządzeniu" : "Changes are saved only on this device");
    expect(before.storage.setItem("coachfi-tokens", "17")).toBe(true);
    const after = useProductStorage(); const pending = ProductScopeBoundary({ children: "FIXTURE_FORM" });
    expect(text(pending)).toContain(locale === "pl" ? "nie mają potwierdzenia zapisu na koncie" : "no confirmed account save");
    expect(text(pending)).toContain(locale === "pl" ? "Możesz wyeksportować dane" : "You can export data");
    expect(pending.key).toBe(readOnly.key); expect(after.storage).toBe(before.storage);
    expect(after.sessionStorage).toBe(before.sessionStorage); expect(text(pending)).toContain("FIXTURE_FORM");
  });
});
