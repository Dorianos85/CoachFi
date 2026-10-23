import { expect, test, type Page } from "@playwright/test";

test.skip(true, "External ConvAI is disabled in P0. Its absence is tested in p0-safety.spec.ts; these provider fixtures require a future reviewed adapter.");

const LABELS = { en: "Start conversation", pl: "Rozpocznij rozmowę", ja: "会話を始める" } as const;
const CHAT_LABELS = { en: "Start text chat", pl: "Rozpocznij czat", ja: "チャットを始める" } as const;
type TestLocale = keyof typeof LABELS;

// Deliberately conflicting provider strings prove that the app's text-contents
// attribute wins over both provider defaults and provider language presets.
const WIDGET_CONFIG = {
  variant: "full", placement: "bottom-right", avatar: { type: "image", url: "/brand/mila/mila-head-neutral.svg" },
  feedback_mode: "none", language: "en", mic_muting_enabled: true, transcript_enabled: true,
  text_input_enabled: true, default_expanded: false, always_expanded: false, dismissible: true,
  text_contents: { main_label: "Legacy provider label", start_call: "Legacy Start a call", start_chat: "Legacy Message" },
  language_presets: {
    en: { text_contents: { start_call: "Legacy English call", start_chat: "Legacy English message" } },
    pl: { text_contents: { start_call: "Legacy Polish call", start_chat: "Legacy Polish message" } },
    ja: { text_contents: { start_call: "Legacy Japanese call", start_chat: "Legacy Japanese message" } },
  },
  disable_banner: true, text_only: false, supports_text_only: true, styles: {},
};

async function prepareWidget(page: Page, locale: TestLocale, textOnly = false, tokenGate?: Promise<void>) {
  let conversationSockets = 0;
  await page.routeWebSocket(/elevenlabs/i, (socket) => {
    conversationSockets += 1;
    socket.close();
  });
  await page.route("**/api/mila-token", async (route) => {
    await tokenGate;
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ agentId: "agent_qaonly", widgetConfig: WIDGET_CONFIG }),
    });
  });
  await page.route(/https:\/\/[^/]*elevenlabs\.io\//, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/widget")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ widget_config: WIDGET_CONFIG }) });
    }
    return route.abort();
  });
  await page.addInitScript(({ selectedLocale, textOnlyMode }) => {
    const timestamp = new Date().toISOString();
    localStorage.clear();
    localStorage.setItem("coachfi-locale-v1", selectedLocale);
    localStorage.setItem("coachfi-agent-text-only", String(textOnlyMode));
    localStorage.setItem("coachfi-consent-v1", JSON.stringify({
      version: "2026-05-10", acceptedAt: timestamp, termsAccepted: true, privacyAccepted: true,
      optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
    }));
    localStorage.setItem("coachfi-mode-v1", JSON.stringify({ mode: "adult", selectedAt: timestamp, adultConfirmedAt: timestamp }));
    localStorage.setItem("coachfi-user", JSON.stringify({ name: "QA", goal: "testing", setupDone: true }));

    // Inspection only: the production wrapper is closed. The real vendor script,
    // React component and native button rendering are otherwise unchanged.
    const attachShadow = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init: ShadowRootInit) {
      return attachShadow.call(this, { ...init, mode: "open" });
    };
    const qaWindow = window as typeof window & { __qaMilaMicRequests: number };
    qaWindow.__qaMilaMicRequests = 0;
    if (navigator.mediaDevices) {
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => {
          qaWindow.__qaMilaMicRequests += 1;
          return Promise.reject(new Error("QA does not start microphone conversations"));
        },
      });
    }
  }, { selectedLocale: locale, textOnlyMode: textOnly });
  return () => conversationSockets;
}

async function readyWidget(page: Page) {
  const widget = page.locator("elevenlabs-convai");
  // The backend fixture changes the React key. Wait for that final instance
  // before changing native controls or attaching deterministic click fixtures.
  await expect(widget).toHaveAttribute("agent-id", "agent_qaonly");
  await expect(widget).toHaveAttribute("override-config", /.+/);
  return widget;
}

for (const viewport of [{ width: 360, height: 800 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`Mila launcher stays at the bottom right without covering navigation at ${viewport.width}px`, async ({ page }, testInfo) => {
    const socketCount = await prepareWidget(page, "pl");
    await page.setViewportSize(viewport);
    await page.goto("/");
    const launcher = page.getByTestId("mila-launcher");
    await expect(launcher).toBeVisible();
    await expect(launcher).toContainText(LABELS.pl);
    const button = launcher.locator("button").or(launcher.and(page.getByRole("button")));
    await expect(button).toHaveAccessibleName(/Rozpocznij rozmowę/);

    const rect = await launcher.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.x + rect!.width / 2).toBeGreaterThan(viewport.width / 2);
    const rightGap = viewport.width - rect!.x - rect!.width;
    expect(rightGap).toBeGreaterThanOrEqual(8);
    expect(rightGap).toBeLessThanOrEqual(32);
    expect(rect!.y).toBeGreaterThan(viewport.height / 2);
    expect(rect!.width).toBeLessThanOrEqual(viewport.width - 24);
    expect(rect!.width).toBeLessThanOrEqual(280);
    expect(rect!.height).toBeCloseTo(56, 1);
    const avatarRect = await launcher.getByRole("img").boundingBox();
    expect(avatarRect).not.toBeNull();
    expect(avatarRect!.width).toBeCloseTo(40, 1);
    expect(avatarRect!.height).toBeCloseTo(40, 1);

    const navigation = page.getByRole("navigation", { name: "Nawigacja mobilna", exact: true });
    if (viewport.width < 1024) {
      await expect(navigation).toBeVisible();
      const navRect = await navigation.boundingBox();
      expect(navRect).not.toBeNull();
      expect(rect!.y + rect!.height).toBeLessThanOrEqual(navRect!.y - 8);
    } else {
      await expect(navigation).toBeHidden();
      expect(viewport.height - rect!.y - rect!.height).toBeGreaterThanOrEqual(8);
      expect(viewport.height - rect!.y - rect!.height).toBeLessThanOrEqual(32);
    }

    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath(`mila-launcher-${viewport.width}.png`) });

    // A returning user's final footer controls must be scrollable above both
    // the launcher and the fixed mobile navigation, rather than covered by them.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    for (const label of ["Zgody", "Zmień tryb"]) {
      const control = page.getByRole("button", { name: label, exact: true });
      await expect(control).toBeVisible();
      await expect.poll(async () => {
        const controlRect = await control.boundingBox();
        return controlRect ? controlRect.y + controlRect.height : Number.POSITIVE_INFINITY;
      }).toBeLessThanOrEqual(rect!.y - 8);
    }
    expect(socketCount()).toBe(0);
    expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
  });
}

test("returning user's consent and mode dialogs hide Mila until the dialog closes", async ({ page }, testInfo) => {
  const socketCount = await prepareWidget(page, "pl");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const launcher = page.getByTestId("mila-launcher");
  await expect(launcher).toBeVisible();

  await page.getByRole("button", { name: "Zgody", exact: true }).click();
  const consentDialog = page.getByRole("dialog", { name: "Zasady korzystania z Coach FI", exact: true });
  await expect(consentDialog).toBeVisible();
  await expect(launcher).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("mila-consent-modal-390.png") });
  await page.getByRole("button", { name: "Zamknij ustawienia zgód", exact: true }).click();
  await expect(consentDialog).toBeHidden();
  await expect(launcher).toBeVisible();

  await page.getByRole("button", { name: "Zmień tryb", exact: true }).click();
  const modeDialog = page.getByRole("dialog", { name: "Kto korzysta z Coach FI?", exact: true });
  await expect(modeDialog).toBeVisible();
  await expect(launcher).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("mila-mode-modal-390.png") });
  // Dismiss the existing settings dialog; do not alter the user's age/mode.
  await page.getByRole("button", { name: "Zamknij wybór trybu", exact: true }).click();
  await expect(modeDialog).toBeHidden();
  await expect(launcher).toBeVisible();
  expect(socketCount()).toBe(0);
});

test("Mila yields to an editable health-check field and returns after keyboard focus leaves it", async ({ page }, testInfo) => {
  const socketCount = await prepareWidget(page, "pl");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/health-check");
  const launcher = page.getByTestId("mila-launcher");
  await expect(launcher).toBeVisible();
  const income = page.locator('main input[type="number"]').first();
  await expect(income).toBeVisible();
  await income.focus();
  await expect(income).toBeFocused();
  await expect(launcher).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("mila-editable-focus-390.png") });

  let editableFocused = true;
  for (let step = 0; step < 20 && editableFocused; step += 1) {
    await page.keyboard.press("Tab");
    editableFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof Element && active.matches(
        'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, [contenteditable="true"]',
      );
    });
  }
  expect(editableFocused).toBe(false);
  await expect(launcher).toBeVisible();
  expect(socketCount()).toBe(0);
});

test("a missing native start control times out without leaving a full-screen widget frame", async ({ page }) => {
  const socketCount = await prepareWidget(page, "pl");
  await page.goto("/");
  const widget = await readyWidget(page);
  await expect.poll(() => widget.evaluate((element) =>
    Array.from(element.shadowRoot?.querySelectorAll("button") ?? [])
      .some((button) => button.getAttribute("aria-label") === "Rozpocznij rozmowę"),
  )).toBe(true);
  // Deterministic provider-readiness failure: remove only the native start
  // controls from the real widget. No provider conversation is started.
  await widget.evaluate((element) => {
    for (const button of element.shadowRoot?.querySelectorAll("button") ?? []) {
      if (["Rozpocznij rozmowę", "Rozpocznij czat"].includes(button.getAttribute("aria-label") ?? "")) button.remove();
    }
  });
  const launcher = page.getByTestId("mila-launcher");
  const frame = page.locator("[data-mila-voice]");
  await expect.poll(() => frame.evaluate((element) => getComputedStyle(element).display)).toBe("none");
  await launcher.click();
  await expect(frame).toHaveAttribute("data-open", "");
  await expect(page.locator(".mila-launcher-dock").getByRole("status")).toBeVisible({ timeout: 7000 });
  await expect.poll(() => frame.getAttribute("data-open"), { timeout: 7000 }).toBeNull();
  await expect(launcher).toBeVisible();
  expect(socketCount()).toBe(0);
  expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
});

test("an SDK connection that stays idle recovers without leaving a full-screen widget frame", async ({ page }) => {
  const socketCount = await prepareWidget(page, "pl");
  await page.goto("/");
  const widget = await readyWidget(page);
  await expect.poll(() => widget.evaluate((element) =>
    Array.from(element.shadowRoot?.querySelectorAll("button") ?? [])
      .some((button) => button.getAttribute("aria-label") === "Rozpocznij rozmowę"),
  )).toBe(true);
  await widget.evaluate((element) => {
    // The real native control is activated, while its provider session handler
    // is stopped. A separate SDK event below simulates a connection that never
    // progresses beyond the idle controls; no microphone or session is opened.
    for (const button of element.shadowRoot?.querySelectorAll("button") ?? []) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
      }, { capture: true });
    }
  });
  const launcher = page.getByTestId("mila-launcher");
  const frame = page.locator("[data-mila-voice]");
  await expect.poll(() => frame.evaluate((element) => getComputedStyle(element).display)).toBe("none");
  await launcher.click();
  await expect(frame).toHaveAttribute("data-open", "");
  await expect(launcher).toBeHidden();
  const callListenerHandled = await widget.evaluate((element) => {
    const config: { clientTools?: Record<string, unknown> } = {};
    element.dispatchEvent(new CustomEvent("elevenlabs-convai:call", { detail: { config } }));
    return typeof config.clientTools?.navigateToCoachFIPage === "function";
  });
  expect(callListenerHandled).toBe(true);
  await expect.poll(() => frame.getAttribute("data-open"), { timeout: 25000 }).toBeNull();
  await expect(launcher).toBeVisible();
  await expect(page.locator(".mila-launcher-dock").getByRole("status")).toBeVisible();
  expect(socketCount()).toBe(0);
  expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
});

test("a delayed token response closes the replaced widget and never auto-starts its replacement", async ({ page }) => {
  let releaseToken!: () => void;
  const tokenGate = new Promise<void>((resolve) => { releaseToken = resolve; });
  const socketCount = await prepareWidget(page, "pl", false, tokenGate);
  await page.goto("/");
  const initialWidget = page.locator("elevenlabs-convai");
  await expect(initialWidget).not.toHaveAttribute("agent-id", "agent_qaonly");
  await expect.poll(() => initialWidget.evaluate((element) =>
    Array.from(element.shadowRoot?.querySelectorAll("button") ?? [])
      .some((button) => button.getAttribute("aria-label") === "Rozpocznij rozmowę"),
  )).toBe(true);
  await page.evaluate(() => {
    const qaWindow = window as typeof window & { __qaDelayedNativeStarts: string[] };
    qaWindow.__qaDelayedNativeStarts = [];
    // Capture across both widget instances. Prevent real SDK startup even if a
    // regression attempts an automatic second native click after the re-key.
    document.addEventListener("click", (event) => {
      const nativeButton = event.composedPath().find((node) => {
        if (!(node instanceof HTMLButtonElement) || node.getAttribute("aria-label") !== "Rozpocznij rozmowę") return false;
        const root = node.getRootNode();
        return root instanceof ShadowRoot && root.host.tagName === "ELEVENLABS-CONVAI";
      });
      if (!nativeButton) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      qaWindow.__qaDelayedNativeStarts.push("Rozpocznij rozmowę");
    }, { capture: true });
  });
  const frame = page.locator("[data-mila-voice]");
  await expect.poll(() => frame.evaluate((element) => getComputedStyle(element).display)).toBe("none");
  const launcher = page.getByTestId("mila-launcher");
  await launcher.click();
  await expect(frame).toHaveAttribute("data-open", "");
  await expect(launcher).toBeHidden();
  const handled = await initialWidget.evaluate((element) => {
    const config: { clientTools?: Record<string, unknown> } = {};
    element.dispatchEvent(new CustomEvent("elevenlabs-convai:call", { detail: { config } }));
    return typeof config.clientTools?.navigateToCoachFIPage === "function";
  });
  expect(handled).toBe(true);

  releaseToken();
  await readyWidget(page);
  await expect.poll(() => frame.getAttribute("data-open")).toBeNull();
  await expect.poll(() => frame.evaluate((element) => getComputedStyle(element).display)).toBe("none");
  await expect(launcher).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __qaDelayedNativeStarts: string[] }).__qaDelayedNativeStarts))
    .toEqual(["Rozpocznij rozmowę"]);
  expect(socketCount()).toBe(0);
  expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
});

for (const locale of ["en", "pl", "ja"] as const) {
  test(`real ElevenLabs widget uses the localized native conversation label in ${locale}`, async ({ page }) => {
    const socketCount = await prepareWidget(page, locale);
    await page.goto("/");
    await expect(page.getByTestId("mila-launcher")).toContainText(LABELS[locale]);
    const widget = await readyWidget(page);
    await expect(widget).toHaveCount(1);
    await expect.poll(async () => widget.evaluate((element, label) =>
      Array.from(element.shadowRoot?.querySelectorAll("button") ?? [])
        .filter((button) => button.getAttribute("aria-label") === label)
        .map((button) => ({ label: button.getAttribute("aria-label"), text: button.textContent?.trim() ?? "" })),
      LABELS[locale],
    )).toContainEqual({ label: LABELS[locale], text: LABELS[locale] });
    const actualOverrides = await widget.getAttribute("text-contents");
    const parsedOverrides = JSON.parse(actualOverrides ?? "{}");
    expect(parsedOverrides.start_call).toBe(LABELS[locale]);
    expect(parsedOverrides.start_chat).toBe(CHAT_LABELS[locale]);
    expect(socketCount()).toBe(0);
    expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
  });
}

for (const textOnly of [false, true]) {
test(`keyboard activation selects the localized native ${textOnly ? "text chat" : "voice"} start button and never an end-call button`, async ({ page }) => {
  const socketCount = await prepareWidget(page, "pl", textOnly);
  const desiredLabel = textOnly ? CHAT_LABELS.pl : LABELS.pl;
  await page.goto("/");
  const widget = await readyWidget(page);
  await expect.poll(() => widget.evaluate((element, label) =>
    Array.from(element.shadowRoot?.querySelectorAll("button") ?? [])
      .some((button) => button.getAttribute("aria-label") === label), desiredLabel,
  )).toBe(true);
  await widget.evaluate((element) => {
    const qaWindow = window as typeof window & { __qaNativeMilaClicks: string[] };
    qaWindow.__qaNativeMilaClicks = [];
    const root = element.shadowRoot!;
    const endButton = document.createElement("button");
    endButton.hidden = true;
    endButton.setAttribute("aria-label", "End conversation");
    endButton.textContent = "End conversation";
    root.prepend(endButton);
    for (const button of root.querySelectorAll("button")) {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        qaWindow.__qaNativeMilaClicks.push(button.getAttribute("aria-label") ?? "");
      }, { capture: true });
    }
  });
  const launcher = page.getByTestId("mila-launcher");
  await launcher.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() =>
    (window as typeof window & { __qaNativeMilaClicks: string[] }).__qaNativeMilaClicks,
  )).toEqual([desiredLabel]);
  await expect(launcher).toBeHidden();
  expect(socketCount()).toBe(0);
  expect(await page.evaluate(() => (window as typeof window & { __qaMilaMicRequests: number }).__qaMilaMicRequests)).toBe(0);
});
}
