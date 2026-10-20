import { expect, test, type Locator, type Page } from "@playwright/test";

// Frozen pre-migration values from styles/coachfi/{tokens,aliases}.css,
// components/ui/button.tsx and the accepted adult/family/dashboard source.
// Do not replace these expectations with values sampled from the new output.
const BASELINE = {
  white: [255, 255, 255], ink: [30, 27, 46], lavender: [205, 190, 255],
  subtleBorder: [236, 230, 221], grape: [91, 75, 196], yellow: [250, 204, 21],
  mint: [236, 253, 245], slateInk: [15, 23, 42], dark: [17, 24, 39], blue: [29, 78, 216],
  cardRadius: "20px", buttonRadius: "14px", sheetRadius: "28px",
} as const;
type Style = {
  foreground: number[]; background: number[]; effectiveBackground: number[]; contrast: number;
  radius: string; borderColor: number[]; borderWidth: string; shadow: string;
  outlineColor: number[]; outlineWidth: string; outlineStyle: string; outlineOffset: string;
  ringColor: number[] | null; focusVisible: boolean; width: number; height: number;
};

test.use({ locale: "pl-PL", serviceWorkers: "block" });

async function settle(page: Page) {
  // Wait for the sampled main view and its ancestors, not unrelated header
  // decoration. Infinite animations inside that scope still fail boundedly.
  return page.evaluate(async () => {
    const mains = document.querySelectorAll("main");
    if (mains.length !== 1) throw new Error("Animation readiness requires exactly one main");
    const main = mains[0];
    const started = performance.now(), deadline = started + 1500;
    let observed = 0;
    const excluded = new Map<Animation, { tag: string; className: string; iterations: number | string; animationName: string }>();
    const active = () => {
      if (!main.isConnected || document.querySelectorAll("main").length !== 1 || document.querySelector("main") !== main) {
        throw new Error("Animation readiness main changed");
      }
      return document.getAnimations().filter(animation => {
        if (animation.playState !== "running" && !animation.pending) return false;
        const effect = animation.effect;
        if (!(effect instanceof KeyframeEffect) || !(effect.target instanceof Element)) {
          throw new Error("Unsupported animation readiness target");
        }
        const target = effect.target;
        if (main.contains(target) || target.contains(main)) return true;
        if (!excluded.has(animation)) {
          if (excluded.size >= 20) return false;
          const iterations = effect.getTiming().iterations ?? 1;
          excluded.set(animation, { tag: target.tagName.toLowerCase(), className: (target.getAttribute("class") ?? "").slice(0, 256),
            iterations: Number.isFinite(iterations) ? iterations : String(iterations),
            animationName: animation instanceof CSSAnimation ? animation.animationName : "web-animation" });
        }
        return false;
      });
    };
    for (;;) {
      const animations = active(); observed += animations.length;
      if (animations.length === 0) {
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (active().length === 0) return { observed, elapsedMs: performance.now() - started,
          scope: "main-and-ancestors", excluded: [...excluded.values()] };
      } else {
        const remaining = deadline - performance.now();
        if (remaining <= 0) throw new Error("Actual CSS animations did not settle within 1500ms");
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          await Promise.race([
            Promise.allSettled(animations.map(animation => animation.finished)),
            new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Animation readiness deadline")), remaining); }),
          ]);
        } finally { if (timer !== undefined) clearTimeout(timer); }
      }
      if (performance.now() >= deadline) throw new Error("Animation readiness deadline");
    }
  });
}

async function style(locator: Locator): Promise<Style> {
  await expect(locator).toBeVisible();
  return locator.evaluate(element => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("sRGB color conversion unavailable");
    const color = (value: string): number[] => {
      if (!CSS.supports("color", value) || /var\(|currentcolor/i.test(value)) throw new Error("Unresolved computed color");
      context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1, { colorSpace: "srgb" }).data;
      return [r, g, b, a / 255];
    };
    const over = (front: number[], back: number[]) => {
      const alpha = front[3] + back[3] * (1 - front[3]);
      return alpha === 0 ? [0, 0, 0, 0] : [0, 1, 2].map(channel =>
        (front[channel] * front[3] + back[channel] * back[3] * (1 - front[3])) / alpha).concat(alpha);
    };
    const computed = getComputedStyle(element);
    // Ancestor opacity changes the whole painted subtree; do not pretend a
    // background-only calculation accounts for it. Gradients before an opaque
    // layer are also unsupported, so a misleading ratio cannot silently pass.
    for (let node: Element | null = element; node; node = node.parentElement) {
      const current = getComputedStyle(node);
      if (Number(current.opacity) !== 1 || current.filter !== "none") throw new Error("Unsupported ancestor opacity/filter");
    }
    let background = [0, 0, 0, 0];
    for (let node: Element | null = element; node && background[3] < 0.999; node = node.parentElement) {
      const current = getComputedStyle(node);
      if (current.backgroundImage !== "none") throw new Error("Unsupported effective background image");
      background = over(background, color(current.backgroundColor));
    }
    if (background[3] < 0.999) throw new Error("No opaque ancestor background");
    const foreground = color(computed.color);
    if (foreground[3] < 0.999) throw new Error("Unsupported translucent foreground");
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(channel => {
      const value = channel / 255; return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const a = luminance(foreground), b = luminance(background), bounds = element.getBoundingClientRect();
    const ring = computed.getPropertyValue("--tw-ring-color").trim();
    return {
      foreground, background: color(computed.backgroundColor), effectiveBackground: background,
      contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), radius: computed.borderTopLeftRadius,
      borderColor: color(computed.borderTopColor), borderWidth: computed.borderTopWidth, shadow: computed.boxShadow,
      outlineColor: color(computed.outlineColor), outlineWidth: computed.outlineWidth, outlineStyle: computed.outlineStyle,
      outlineOffset: computed.outlineOffset, ringColor: ring ? color(ring) : null,
      focusVisible: element.matches(":focus-visible"), width: bounds.width, height: bounds.height,
    };
  });
}

function rgb(actual: number[] | null, expected: readonly number[]) {
  expect(actual).not.toBeNull();
  for (let channel = 0; channel < 3; channel++) expect(Math.abs(actual![channel] - expected[channel])).toBeLessThanOrEqual(1);
  expect(actual![3]).toBeGreaterThanOrEqual(0.999);
}
function primary(value: Style) {
  rgb(value.background, BASELINE.lavender); rgb(value.foreground, BASELINE.ink); rgb(value.borderColor, BASELINE.ink);
  expect(value.radius).toBe(BASELINE.buttonRadius); expect(value.borderWidth).toBe("2px");
  expect(value.height).toBeGreaterThanOrEqual(44); expect(value.contrast).toBeGreaterThanOrEqual(4.5);
}
function softShadow(value: Style) {
  expect(value.shadow).toContain("0px 1px 2px"); expect(value.shadow).toContain("0px 2px 8px");
}
async function fits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  await expect(page.locator("main")).toHaveCount(1);
}
async function keyboardFocus(page: Page, target: Locator) {
  await target.focus(); await page.keyboard.press("Tab"); await page.keyboard.press("Shift+Tab");
  await expect(target).toBeFocused(); await settle(page);
  const value = await style(target); expect(value.focusVisible).toBe(true); return value;
}
async function contrast(page: Page, enabled: boolean) {
  const control = page.getByRole("button", { name: "Kontrast", exact: true }).filter({ visible: true });
  await expect(control).toHaveCount(1);
  if ((await control.getAttribute("aria-pressed")) !== String(enabled)) await control.click();
  await expect(control).toHaveAttribute("aria-pressed", String(enabled));
  await page.mouse.move(0, 0); return settle(page);
}

for (const width of [375, 1280] as const) test(`${width}: preserves Coachfi design after dependency changes`, async ({ page, context }, testInfo) => {
  const base = new URL(String(testInfo.project.use.baseURL));
  expect(base.protocol).toBe("http:"); expect(base.hostname).toBe("127.0.0.1");
  expect(base.username + base.password + base.search + base.hash).toBe("");
  const api: string[] = [], external: string[] = [], pageErrors: string[] = [], sockets: string[] = [];
  const observations: Record<string, unknown> = {};
  context.on("request", request => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/")) api.push(url.pathname);
    if (url.origin !== base.origin) external.push(url.origin + url.pathname);
  });
  await context.route("**/*", route => {
    const url = new URL(route.request().url());
    return url.origin === base.origin && !url.pathname.startsWith("/api/") ? route.continue() : route.abort();
  });
  await context.routeWebSocket("**/*", socket => { sockets.push(new URL(socket.url()).origin); socket.close(); });
  page.on("pageerror", error => pageErrors.push(error.name));
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
  await page.clock.setFixedTime(new Date("2026-10-20T12:00:00.000Z"));
  // This is an isolated synthetic Playwright context. Only locale is seeded;
  // readiness is granted through actual controls, never by a real user's profile.
  await page.addInitScript(() => localStorage.setItem("coachfi-locale-v1", "pl"));
  const record = async (name: string, target: Locator) => { const value = await style(target); observations[name] = value; return value; };
  try {
    await page.goto("/adult"); const adult = page.getByTestId("adult-path"); await expect(adult).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "pl");
    await page.getByRole("button", { name: "Akceptuj wymagane", exact: true }).click();
    const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
    await dialog.getByRole("checkbox", { name: "Mam ukończone 18 lat.", exact: true }).check();
    await dialog.getByRole("button", { name: "Kontynuuj jako osoba dorosła", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(adult.locator('input[name="adult-goal"][value="budget"]')).toBeEnabled();
    await adult.locator('input[name="adult-goal"][value="budget"]').check();
    const adultRead = adult.getByRole("button", { name: "Przeczytałem lekcję", exact: true });
    await page.mouse.move(0, 0); observations.adultSettled = await settle(page);
    const adultCard = await record("adultCard", adult.locator("header"));
    rgb(adultCard.background, BASELINE.white); rgb(adultCard.foreground, BASELINE.ink);
    rgb(adultCard.borderColor, BASELINE.subtleBorder); expect(adultCard.radius).toBe(BASELINE.cardRadius); softShadow(adultCard);
    rgb((await record("adultHeading", adult.getByRole("heading", { level: 1 }))).foreground, BASELINE.ink);
    primary(await record("adultPrimary", adultRead));
    const normalFocus = await keyboardFocus(page, adultRead); observations.adultNormalFocus = normalFocus;
    rgb(normalFocus.ringColor, BASELINE.grape); expect(normalFocus.shadow).not.toBe("none");
    await adultRead.press("Enter"); await expect(adult.locator('input[name="adult-answer"]')).toHaveCount(3);
    await expect(adult.locator('input[name="adult-answer"]:checked')).toHaveCount(0); await fits(page);
    await page.screenshot({ path: testInfo.outputPath(`adult-${width}.png`), fullPage: true });
    await contrast(page, true);
    const adultHigh = await record("adultHighContrast", adult.getByRole("heading", { level: 1 }));
    rgb(adultHigh.foreground, BASELINE.white); rgb(adultHigh.effectiveBackground, BASELINE.dark); expect(adultHigh.contrast).toBeGreaterThanOrEqual(4.5);
    const adultRadio = adult.locator('input[name="adult-answer"][value="a"]');
    const adultHighFocus = await keyboardFocus(page, adultRadio); observations.adultHighFocus = adultHighFocus;
    rgb(adultHighFocus.outlineColor, BASELINE.yellow); expect(adultHighFocus.outlineWidth).toBe("2px"); expect(adultHighFocus.outlineStyle).toBe("solid");
    await page.screenshot({ path: testInfo.outputPath(`adult-high-contrast-${width}.png`), fullPage: true });
    await contrast(page, false);

    await page.goto("/family"); const family = page.locator('[data-learning-path="family"]'); await expect(family).toBeVisible();
    const needs = family.getByRole("button", { name: /^Potrzeba czy zachcianka\?/ }); await expect(needs).toBeEnabled();
    await needs.click(); const familyRead = family.getByRole("button", { name: "Oznaczam materiał jako przeczytany", exact: true });
    await page.mouse.move(0, 0); observations.familySettled = await settle(page);
    const familyHeader = await record("familyHeader", family.locator("header"));
    rgb(familyHeader.background, BASELINE.mint); expect(familyHeader.radius).toBe(BASELINE.sheetRadius);
    const familyHeading = await record("familyHeading", family.getByRole("heading", { level: 1 }));
    rgb(familyHeading.foreground, BASELINE.slateInk); expect(familyHeading.contrast).toBeGreaterThanOrEqual(4.5);
    const otherGoal = family.getByRole("button", { name: /^Wspólny mały cel/ });
    const familyGoalCard = await record("familyGoalCard", otherGoal);
    rgb(familyGoalCard.background, BASELINE.white); expect(familyGoalCard.radius).toBe(BASELINE.cardRadius);
    const familyPanel = await record("familyPanel", family.locator('section[aria-labelledby="family-goal-heading"]'));
    rgb(familyPanel.background, BASELINE.white); expect(familyPanel.radius).toBe(BASELINE.sheetRadius);
    await familyRead.click(); const familySubmit = family.getByRole("button", { name: "Sprawdź odpowiedź", exact: true });
    await page.mouse.move(0, 0); await settle(page);
    // Family's submit is explicitly variant="outline" in the baseline source.
    const familyOutline = await record("familyOutline", familySubmit);
    rgb(familyOutline.background, BASELINE.white); rgb(familyOutline.foreground, BASELINE.ink); rgb(familyOutline.borderColor, BASELINE.ink);
    expect(familyOutline.radius).toBe(BASELINE.buttonRadius); expect(familyOutline.borderWidth).toBe("2px");
    expect(familyOutline.height).toBeGreaterThanOrEqual(44); expect(familyOutline.contrast).toBeGreaterThanOrEqual(4.5);
    await expect(family.locator('input[name="family-answer"]:checked')).toHaveCount(0); await fits(page);
    await page.screenshot({ path: testInfo.outputPath(`family-${width}.png`), fullPage: true });
    await contrast(page, true);
    const familyHigh = await record("familyHighContrast", family.getByRole("heading", { level: 1 }));
    rgb(familyHigh.foreground, BASELINE.white); rgb(familyHigh.effectiveBackground, BASELINE.dark); expect(familyHigh.contrast).toBeGreaterThanOrEqual(4.5);
    const familyHighFocus = await keyboardFocus(page, familySubmit); observations.familyHighFocus = familyHighFocus;
    rgb(familyHighFocus.foreground, BASELINE.white); rgb(familyHighFocus.background, BASELINE.dark); expect(familyHighFocus.contrast).toBeGreaterThanOrEqual(4.5);
    rgb(familyHighFocus.outlineColor, BASELINE.yellow); expect(familyHighFocus.outlineWidth).toBe("2px"); expect(familyHighFocus.outlineStyle).toBe("solid");
    await page.screenshot({ path: testInfo.outputPath(`family-high-contrast-${width}.png`), fullPage: true });
    await contrast(page, false);

    await page.goto("/adult/dashboard");
    const onboarding = page.getByRole("dialog", { name: "Witaj w Coach FI", exact: true });
    await expect(onboarding).toBeVisible();
    await onboarding.getByRole("button", { name: "Zamknij wprowadzenie", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    observations.dashboardOnboardingDismissed = true;
    const dashboard = page.locator('[aria-labelledby="dashboard-title"]');
    const dashboardTitle = dashboard.locator("#dashboard-title"); await expect(dashboardTitle).toBeVisible();
    const hero = dashboard.locator(":scope > section").first().locator(":scope > div").first();
    const diagnosis = dashboard.locator('a[href="/health-check"]').first();
    await expect(diagnosis).toBeVisible(); await page.mouse.move(0, 0); observations.dashboardSettled = await settle(page);
    const heroStyle = await record("dashboardHero", hero);
    expect(heroStyle.background.slice(0, 3)).toEqual([...BASELINE.white]); expect(heroStyle.background[3]).toBeCloseTo(0.9, 2);
    expect(heroStyle.radius).toBe(BASELINE.cardRadius); softShadow(heroStyle);
    rgb((await record("dashboardHeading", dashboardTitle)).foreground, BASELINE.ink);
    primary(await record("dashboardPrimary", diagnosis)); await fits(page);
    const dashboardFocus = await keyboardFocus(page, diagnosis); observations.dashboardNormalFocus = dashboardFocus;
    rgb(dashboardFocus.ringColor, BASELINE.grape); expect(dashboardFocus.shadow).not.toBe("none");
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true });
    await contrast(page, true);
    const dashboardHigh = await record("dashboardHighContrast", dashboardTitle);
    rgb(dashboardHigh.foreground, BASELINE.white); rgb(dashboardHigh.effectiveBackground, BASELINE.dark); expect(dashboardHigh.contrast).toBeGreaterThanOrEqual(4.5);
    const dashboardHighFocus = await keyboardFocus(page, diagnosis); observations.dashboardHighFocus = dashboardHighFocus;
    rgb(dashboardHighFocus.background, BASELINE.blue); rgb(dashboardHighFocus.foreground, BASELINE.white);
    rgb(dashboardHighFocus.ringColor, BASELINE.yellow); expect(dashboardHighFocus.shadow).not.toBe("none"); expect(dashboardHighFocus.contrast).toBeGreaterThanOrEqual(4.5);
    await fits(page); await page.screenshot({ path: testInfo.outputPath(`dashboard-high-contrast-${width}.png`), fullPage: true });
    expect(api).toEqual([]); expect(external).toEqual([]); expect(sockets).toEqual([]); expect(pageErrors).toEqual([]);
  } finally {
    await testInfo.attach("dependency-design-observations", { contentType: "application/json", body: JSON.stringify({ width,
      api, external, sockets, pageErrors, observations, limitations: "Selected PL rendered-style/focus/layout regressions in a new synthetic context. Fixed pre-migration token/source expectations; API/external/WebSocket requests blocked. Same-origin non-API assets allowed. No real account, user profile, provider, real-font, fullWCAG or production acceptance; not whole-browser network isolation." }, null, 2) });
  }
});
