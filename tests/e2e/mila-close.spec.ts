import { readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

test.skip(true, "External ConvAI is disabled in P0. Its absence is tested in p0-safety.spec.ts; these provider fixtures require a future reviewed adapter.");

const WIDGET_CONFIG = {
  variant: "full", placement: "bottom-right", avatar: { type: "image", url: "/brand/mila/mila-head-neutral.svg" },
  language: "pl", mic_muting_enabled: true, transcript_enabled: true, text_input_enabled: true,
  default_expanded: false, always_expanded: false, dismissible: true, end_confirmation_enabled: false,
  end_feedback: { type: "rating" }, disable_banner: true, text_only: false, supports_text_only: true,
  text_contents: { start_call: "Rozpocznij rozmowę", start_chat: "Rozpocznij czat", end_call: "Zakończ rozmowę", end_chat: "Zakończ czat" },
  language_presets: {}, styles: {},
};

interface SessionMetrics {
  starts: number;
  endCalls: number;
  transportCloses: number;
  trackStops: number;
  activeResources: number;
  pending: number;
  hardwareRequests: number;
  preflightRequests: number;
  preflightCompletions: number;
}

interface TestSdkSession {
  markConnected: () => void;
  endSession: () => Promise<void>;
  onMessage?: (event: Record<string, unknown>) => Promise<void>;
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  setVolume?: () => void;
  setMicMuted?: () => void;
}

interface TestSdkConstructor {
  new(options: Record<string, unknown>, connection: Record<string, unknown>): TestSdkSession;
  getFullOptions: (options: Record<string, unknown>) => Record<string, unknown>;
}

type QaWindow = typeof window & {
  __milaCloseMetrics: SessionMetrics;
  __qaStartSdkSession: (Sdk: TestSdkConstructor, options: Record<string, unknown>) => Promise<TestSdkSession>;
  __qaResolvePendingSdk: () => void;
  __qaFingerprint: () => Promise<string>;
  __qaResolveFingerprint: () => void;
};

// Keep the real vendored widget, its native controls and its real SDK endSession
// implementation. Replace only SDK session creation with an in-memory transport.
// The unique marker makes a future vendor update fail explicitly instead of
// silently turning this into a visual-only test or opening a real connection.
const vendorScript = readFileSync(new URL("../../public/elevenlabs/convai-widget.js", import.meta.url), "utf8");
const sdkMarker = "function RC(){";
if (vendorScript.split(sdkMarker).length !== 2) throw new Error("Update the guarded Mila SDK transport fixture for this vendor version.");
async function prepare(page: Page, pending = false, preflight = false) {
  const instrumentedVendor = vendorScript.replace(
    sdkMarker,
    `_v.startSession=(options)=>window.__qaStartSdkSession(u,options);${preflight ? "zC=()=>window.__qaFingerprint();" : ""}${sdkMarker}`,
  );
  let sockets = 0;
  await page.routeWebSocket(/elevenlabs/i, (socket) => { sockets += 1; socket.close(); });
  await page.route(/\/elevenlabs\/convai-widget\.js(?:\?.*)?$/, (route) => route.fulfill({
    status: 200, contentType: "application/javascript", body: instrumentedVendor,
  }));
  await page.route("**/api/mila-token", (route) => route.fulfill({
    status: 200, contentType: "application/json", body: JSON.stringify({ agentId: "agent_qaclose", widgetConfig: WIDGET_CONFIG }),
  }));
  await page.route(/https:\/\/[^/]*elevenlabs\.io\//, (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/widget")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ widget_config: WIDGET_CONFIG }) });
    }
    return route.abort();
  });
  await page.addInitScript(({ delaySession }) => {
    const timestamp = new Date().toISOString();
    localStorage.clear();
    localStorage.setItem("coachfi-locale-v1", "pl");
    localStorage.setItem("elevenlabs_convai_user_id", "qa-in-memory-user");
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({
      version: "2026-05-10", acceptedAt: timestamp, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
    }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: timestamp, adultConfirmedAt: timestamp }));
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "QA", goal: "testing", setupDone: true }));
    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init: ShadowRootInit) { return attachShadow.call(this, { ...init, mode: "open" }); };

    const qa = window as QaWindow;
    qa.__milaCloseMetrics = { starts: 0, endCalls: 0, transportCloses: 0, trackStops: 0, activeResources: 0, pending: 0, hardwareRequests: 0, preflightRequests: 0, preflightCompletions: 0 };
    let resolvePending: (() => void) | null = null;
    qa.__qaResolvePendingSdk = () => { resolvePending?.(); resolvePending = null; };
    let resolveFingerprint: ((id: string) => void) | null = null;
    qa.__qaFingerprint = async () => {
      qa.__milaCloseMetrics.preflightRequests += 1;
      const id = await new Promise<string>((resolve) => { resolveFingerprint = resolve; });
      qa.__milaCloseMetrics.preflightCompletions += 1;
      return id;
    };
    qa.__qaResolveFingerprint = () => { resolveFingerprint?.("qa-delayed-user"); resolveFingerprint = null; };
    if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: () => {
        qa.__milaCloseMetrics.hardwareRequests += 1;
        return Promise.reject(new Error("The close fixture never uses real microphone hardware."));
      },
    });

    qa.__qaStartSdkSession = async (Sdk, options) => {
      const metrics = qa.__milaCloseMetrics;
      metrics.starts += 1;
      metrics.activeResources += 1;
      let transportClosed = false;
      const fakeTrack = { stop: () => { metrics.trackStops += 1; } };
      const connection = {
        conversationId: `qa-session-${metrics.starts}`,
        onMessage: () => {}, onDisconnect: () => {}, onModeChange: () => {}, onOutgoingMessage: () => {}, sendMessage: () => {},
        close: () => {
          if (transportClosed) return;
          transportClosed = true;
          metrics.transportCloses += 1;
          fakeTrack.stop();
          metrics.activeResources -= 1;
        },
      };
      const session = new Sdk(Sdk.getFullOptions(options), connection);
      const realEndSession = session.endSession.bind(session);
      session.endSession = async () => { metrics.endCalls += 1; await realEndSession(); };
      session.getInputVolume = () => 0;
      session.getOutputVolume = () => 0;
      session.setVolume = () => {};
      session.setMicMuted = () => {};
      const connected = () => {
        session.markConnected();
        void session.onMessage?.({ type: "agent_response", agent_response_event: { event_id: 1, agent_response: "To jest rozmowa testowa." } });
        return session;
      };
      if (!delaySession) return connected();
      (options.onStatusChange as ((event: { status: string }) => void) | undefined)?.({ status: "connecting" });
      metrics.pending += 1;
      return new Promise<TestSdkSession>((resolve) => {
        resolvePending = () => { metrics.pending -= 1; resolve(connected()); };
      });
    };
  }, { delaySession: pending });
  return () => sockets;
}

async function widgetReady(page: Page) {
  const widget = page.locator("elevenlabs-convai");
  await expect(widget).toHaveAttribute("agent-id", "agent_qaclose");
  await expect(widget).toHaveAttribute("override-config", /.+/);
  await expect.poll(() => widget.evaluate((element) =>
    Array.from(element.shadowRoot?.querySelectorAll("button") ?? []).some((button) => button.getAttribute("aria-label") === "Rozpocznij rozmowę"),
  )).toBe(true);
  return widget;
}

async function openSession(page: Page, pending = false) {
  await page.goto("/");
  const widget = await widgetReady(page);
  await page.getByTestId("mila-launcher").click();
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.starts)).toBe(1);
  await expect(page.getByTestId("mila-end-conversation")).toBeVisible();
  await expect(page.getByTestId("mila-end-conversation")).toHaveAccessibleName("Zakończ rozmowę z Milą");
  await expect(page.locator("[data-mila-voice]")).toHaveAttribute("data-open", "");
  if (!pending) await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.activeResources)).toBe(1);
  return widget;
}

async function restoredAvatar(page: Page, releasedSessions = 1) {
  const frame = page.locator("[data-mila-voice]");
  await expect.poll(() => frame.getAttribute("data-open")).toBeNull();
  await expect.poll(() => frame.evaluate((element) => getComputedStyle(element).display)).toBe("none");
  const launcher = page.getByTestId("mila-launcher");
  await expect(launcher).toBeVisible();
  await expect(page.getByTestId("mila-end-conversation")).toBeHidden();
  const bounds = await launcher.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeCloseTo(56, 1);
  expect(bounds!.height).toBeCloseTo(56, 1);
  const avatar = await launcher.getByRole("img").boundingBox();
  expect(avatar!.width).toBeCloseTo(40, 1);
  expect(avatar!.height).toBeCloseTo(40, 1);
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.activeResources)).toBe(0);
  const metrics = await page.evaluate(() => (window as QaWindow).__milaCloseMetrics);
  expect(metrics.transportCloses).toBe(releasedSessions);
  expect(metrics.trackStops).toBe(releasedSessions);
  expect(metrics.endCalls).toBeGreaterThanOrEqual(releasedSessions);
  expect(metrics.hardwareRequests).toBe(0);
  return launcher;
}

async function visibleNativeButton(widget: Locator, label: string) {
  await expect.poll(() => widget.evaluate((element, desired) => {
    const root = element.shadowRoot;
    if (!root) return false;
    for (const previous of root.querySelectorAll("[data-qa-close-control]")) previous.removeAttribute("data-qa-close-control");
    for (const button of root.querySelectorAll<HTMLButtonElement>("button")) {
      if (button.getAttribute("aria-label") !== desired || button.disabled) continue;
      const rect = button.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      let visible = true;
      for (let ancestor: HTMLElement | null = button; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (ancestor.inert || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) { visible = false; break; }
      }
      if (!visible) continue;
      button.setAttribute("data-qa-close-control", "selected");
      return true;
    }
    return false;
  }, label)).toBe(true);
  return widget.locator('[data-qa-close-control="selected"]');
}

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`persistent end button releases the active SDK session and restores only a small avatar at ${viewport.width}px`, async ({ page }, testInfo) => {
    const socketCount = await prepare(page);
    await page.setViewportSize(viewport);
    await openSession(page);
    const end = page.getByTestId("mila-end-conversation");
    await expect(end).toContainText("Zakończ rozmowę");
    const endRect = await end.boundingBox();
    expect(endRect!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath(`mila-active-end-control-${viewport.width}.png`) });
    await end.click();
    const launcher = await restoredAvatar(page);
    const launcherRect = await launcher.boundingBox();
    expect(viewport.width - launcherRect!.x - launcherRect!.width).toBeLessThanOrEqual(32);
    expect(launcherRect!.y).toBeGreaterThan(viewport.height / 2);
    await page.screenshot({ path: testInfo.outputPath(`mila-ended-avatar-${viewport.width}.png`) });
    expect(socketCount()).toBe(0);
  });
}

test("native end after a transcript and rating feedback releases the SDK and removes the centered pane", async ({ page }) => {
  const socketCount = await prepare(page);
  const widget = await openSession(page);
  await expect(widget.getByText("To jest rozmowa testowa.").first()).toBeVisible();
  const nativeEnd = await visibleNativeButton(widget, "Zakończ rozmowę");
  await nativeEnd.click();
  await restoredAvatar(page);
  expect(socketCount()).toBe(0);
});

test("native dismiss of an idle widget returns to only the small avatar", async ({ page }) => {
  const socketCount = await prepare(page);
  await page.goto("/");
  const widget = await widgetReady(page);
  await widget.evaluate((element) => {
    for (const button of element.shadowRoot?.querySelectorAll("button") ?? []) {
      if (button.getAttribute("aria-label") !== "Rozpocznij rozmowę") continue;
      button.addEventListener("click", (event) => { event.preventDefault(); event.stopImmediatePropagation(); }, { capture: true });
    }
  });
  await page.getByTestId("mila-launcher").click();
  await expect(page.getByTestId("mila-end-conversation")).toBeVisible();
  const dismiss = await visibleNativeButton(widget, "Dismiss");
  await dismiss.click();
  await restoredAvatar(page, 0);
  expect(socketCount()).toBe(0);
});

test("Escape from the native text field releases the active session and restores launcher focus", async ({ page }) => {
  const socketCount = await prepare(page);
  const widget = await openSession(page);
  const textInput = widget.locator("textarea:visible").first();
  await expect(textInput).toBeVisible();
  await textInput.focus();
  await page.keyboard.press("Escape");
  const launcher = await restoredAvatar(page);
  await expect(launcher).toBeFocused();
  expect(socketCount()).toBe(0);
});

test("closing during connection releases a late-resolving SDK session without reopening the pane", async ({ page }) => {
  const socketCount = await prepare(page, true);
  await openSession(page, true);
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.pending)).toBe(1);
  await page.getByTestId("mila-end-conversation").click();
  await expect(page.getByTestId("mila-launcher")).toBeVisible();
  await expect.poll(() => page.locator("[data-mila-voice]").getAttribute("data-open")).toBeNull();
  await page.evaluate(() => (window as QaWindow).__qaResolvePendingSdk());
  await restoredAvatar(page);
  expect(await page.evaluate(() => (window as QaWindow).__milaCloseMetrics.pending)).toBe(0);
  expect(socketCount()).toBe(0);
});

test("reopening after end creates a fresh SDK session and both sessions release their resources", async ({ page }) => {
  const socketCount = await prepare(page);
  const firstWidget = await openSession(page);
  const firstHandle = await firstWidget.elementHandle();
  await page.getByTestId("mila-end-conversation").click();
  await restoredAvatar(page);
  expect(await firstHandle!.evaluate((element) => element.isConnected)).toBe(false);

  await widgetReady(page);
  await page.getByTestId("mila-launcher").click();
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.starts)).toBe(2);
  await expect(page.getByTestId("mila-end-conversation")).toBeVisible();
  await page.getByTestId("mila-end-conversation").click();
  await restoredAvatar(page, 2);
  expect(socketCount()).toBe(0);
});

test("closing before fingerprint preflight resolves never starts a detached SDK session", async ({ page }) => {
  const socketCount = await prepare(page, false, true);
  await page.goto("/");
  const widget = await widgetReady(page);
  const oldWidget = await widget.elementHandle();
  await page.getByTestId("mila-launcher").click();
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.preflightRequests)).toBe(1);
  await expect(page.getByTestId("mila-end-conversation")).toBeVisible();
  expect(await page.evaluate(() => (window as QaWindow).__milaCloseMetrics.starts)).toBe(0);
  await page.getByTestId("mila-end-conversation").click();
  await restoredAvatar(page, 0);
  expect(await oldWidget!.evaluate((element) => element.isConnected)).toBe(false);

  await page.evaluate(async () => {
    (window as QaWindow).__qaResolveFingerprint();
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await expect.poll(() => page.evaluate(() => (window as QaWindow).__milaCloseMetrics.preflightCompletions)).toBe(1);
  await restoredAvatar(page, 0);
  expect(await page.evaluate(() => (window as QaWindow).__milaCloseMetrics.starts)).toBe(0);
  expect(socketCount()).toBe(0);
});
