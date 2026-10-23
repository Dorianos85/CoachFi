import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import type { PersonalStorageHandle } from "@/lib/product-storage";

const fixture = vi.hoisted(() => ({ storage: null as unknown as PersonalStorageHandle,
  session: null as unknown as PersonalStorageHandle, stateSet: vi.fn() }));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(),
  useState: (initial: unknown) => [initial, fixture.stateSet] }));
vi.mock("@/lib/use-product-storage", () => ({ useProductStorage: () => ({ storage: fixture.storage, sessionStorage: fixture.session }) }));
vi.mock("@/context/LanguageContext", () => ({ useLanguage: () => ({ locale: "pl" }) }));
vi.mock("@/components/ui/button", () => ({ Button: () => null }));

function clicks(element: unknown): Array<() => void> {
  if (Array.isArray(element)) return element.flatMap(clicks);
  if (!element || typeof element !== "object") return [];
  const props = (element as ReactElement<{ children?: unknown; onClick?: () => void }>).props;
  if (!props) return [];
  return [...(props.onClick ? [props.onClick] : []), ...clicks(props.children)];
}

describe("independent actual DataSafetyPanel callback review", () => {
  let local: Map<string, string>, session: Map<string, string>;
  let reload: ReturnType<typeof vi.fn>, click: ReturnType<typeof vi.fn>, createElement: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.resetModules(); vi.clearAllMocks(); local = new Map(); session = new Map();
    const storage = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); } });
    reload = vi.fn(); click = vi.fn(); createElement = vi.fn(() => ({ click, href: "", download: "" }));
    vi.stubGlobal("window", { localStorage: storage(local), sessionStorage: storage(session), dispatchEvent: vi.fn(), location: { reload } });
    vi.stubGlobal("document", { createElement }); vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network allowed."); }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
  async function renderA() {
    const store = await import("@/lib/product-storage");
    const a = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_A" });
    a.storage.setItem("coachfi-tokens", "88"); a.publishReady();
    fixture.storage = store.captureCurrentPersonalStorage(); fixture.session = store.captureCurrentPersonalStorage("session");
    const { DataSafetyPanel } = await import("@/components/DataSafetyPanel");
    const actions = clicks(DataSafetyPanel()); expect(actions).toHaveLength(2);
    return { store, actions };
  }

  it("old rendered export/delete callbacks after B cannot download, reload or remove B/guest", async () => {
    local.set("coachfi-tokens", "00321");
    const { store, actions } = await renderA();
    const b = store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" });
    b.storage.setItem("coachfi-tokens", "99"); b.publishReady(); const before = [...local];
    fixture.stateSet.mockClear(); actions[0](); actions[1]();
    expect(createElement).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled(); expect(reload).not.toHaveBeenCalled();
    expect([...local]).toEqual(before); expect(local.get("coachfi-tokens")).toBe("00321");
    expect(store.captureCurrentPersonalStorage().getItem("coachfi-tokens")).toBe("99");
    expect(fixture.stateSet.mock.calls.filter(([value]) => value === true)).toHaveLength(2);
  });

  it("owner change while Blob URL is created blocks actual download and always revokes the URL", async () => {
    const { store, actions } = await renderA();
    const create = vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      store.beginStorageOwner({ kind: "account", provider: "cdp", userId: "FIXTURE_B" }).publishReady();
      return "blob:FIXTURE_REVOKE";
    });
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    fixture.stateSet.mockClear(); actions[0]();
    expect(create).toHaveBeenCalledOnce(); expect(createElement).toHaveBeenCalledOnce();
    expect(click).not.toHaveBeenCalled(); expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:FIXTURE_REVOKE");
    expect(fixture.stateSet).toHaveBeenLastCalledWith(true);
  });
});
