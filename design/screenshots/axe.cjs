// Dev-only accessibility sweep for the v6 reskin. Not part of the test suite.
// Usage: AXE_PATH=<path to axe.min.js> node design/screenshots/axe.cjs [baseUrl]
const fs = require("node:fs");
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost:3100";
const axeSource = fs.readFileSync(process.env.AXE_PATH, "utf8");
const routes = [
  "",
  "accessibility",
  "achievement",
  "avatar",
  "cards",
  "challenge",
  "coach",
  "health-check",
  "inflation",
  "kids",
  "learn",
  "learn/money-mindset",
  "learn/saving-habit",
  "partner",
  "privacy",
  "quiz",
  "review",
  "rewards",
  "terms",
  "vault",
  "voice-demo",
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await context.addInitScript(() => {
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
  });
  const page = await context.newPage();
  const totals = {};
  for (const route of routes) {
    await page.goto(`${baseUrl}/${route}`, { waitUntil: "load", timeout: 90000 });
    await page.waitForTimeout(2500);
    await page.evaluate(axeSource);
    const result = await page.evaluate(() =>
      window.axe.run(document, { resultTypes: ["violations"], exclude: [["elevenlabs-convai"], ["nextjs-portal"], [".opacity-30"]] })
    );
    for (const violation of result.violations) {
      totals[violation.id] = (totals[violation.id] || 0) + violation.nodes.length;
      console.log(`/${route}  ${violation.id} (${violation.impact}) x${violation.nodes.length}`);
      for (const node of violation.nodes.slice(0, 6)) {
        const data = node.any[0]?.data || {};
        const detail = data.contrastRatio ? ` ${data.fgColor} on ${data.bgColor} = ${data.contrastRatio}` : "";
        console.log(`    ${node.html.replace(/\s+/g, " ").slice(0, 150)}${detail}`);
      }
    }
  }
  console.log("TOTALS", JSON.stringify(totals));
  await browser.close();
})();
