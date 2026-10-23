// Dev-only visual capture for the v6 reskin. Not part of the test suite.
// Usage: node design/screenshots/capture.cjs <before|after> [baseUrl]
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");

const label = process.argv[2] || "after";
const baseUrl = process.argv[3] || "http://localhost:3100";
const routes = [
  ["home", "/"],
  ["accessibility", "/accessibility"],
  ["achievement", "/achievement"],
  ["avatar", "/avatar"],
  ["cards", "/cards"],
  ["challenge", "/challenge"],
  ["coach", "/coach"],
  ["health-check", "/health-check"],
  ["inflation", "/inflation"],
  ["kids", "/kids"],
  ["learn", "/learn"],
  ["learn-money-mindset", "/learn/money-mindset"],
  ["learn-stage", process.env.STAGE_ROUTE || "/learn/saving-habit"],
  ["partner", "/partner"],
  ["privacy", "/privacy"],
  ["quiz", "/quiz"],
  ["review", "/review"],
  ["rewards", "/rewards"],
  ["terms", "/terms"],
  ["vault", "/vault"],
  ["voice-demo", "/voice-demo"],
];
const viewports = [
  ["390", { width: 390, height: 844 }],
  ["1440", { width: 1440, height: 900 }],
];
const seed = () => {
  localStorage.setItem("coachfi-user", JSON.stringify({ name: "Alex", goal: "save", setupDone: true }));
  localStorage.setItem(
    "coachfi-consent-v1",
    JSON.stringify({
      version: "2026-05-10",
      acceptedAt: "2026-10-12T00:00:00.000Z",
      termsAccepted: true,
      privacyAccepted: true,
      optional: { aiCoach: true, voice: true, leaderboard: false, blockchain: false },
    })
  );
};

(async () => {
  const outDir = path.join(__dirname, label);
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  for (const [vpName, viewport] of viewports) {
    const fresh = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const first = await fresh.newPage();
    await first.goto(baseUrl + "/", { waitUntil: "networkidle" }).catch(() => {});
    await first.waitForTimeout(1200);
    await first.screenshot({ path: path.join(outDir, `first-visit-${vpName}.png`) });
    await fresh.close();

    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    await context.addInitScript(seed);
    const page = await context.newPage();
    for (const [name, route] of routes) {
      try {
        await page.goto(baseUrl + route, { waitUntil: "networkidle", timeout: 90000 });
      } catch (error) {
        console.warn(`slow: ${route}`);
      }
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(outDir, `${name}-${vpName}.png`), fullPage: true });
      console.log(`${label} ${name} ${vpName}`);
    }
    await context.close();
  }
  await browser.close();
})();
