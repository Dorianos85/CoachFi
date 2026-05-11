import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const required = [
  ".gitignore",
  "app/globals.css",
  "app/accessibility/page.tsx",
  "app/coach/page.tsx",
  "app/health-check/page.tsx",
  "app/inflation/page.tsx",
  "app/kids/page.tsx",
  "app/layout.tsx",
  "app/learn/page.tsx",
  "app/page.tsx",
  "app/providers.tsx",
  "app/quiz/page.tsx",
  "app/rewards/page.tsx",
  "components/AccessibilityToggle.tsx",
  "components/AppNavigation.tsx",
  "components/CoachAvatar.tsx",
  "components/FinancialScoreCard.tsx",
  "components/InflationChart.tsx",
  "components/NFTCertificateCard.tsx",
  "components/ProgressPath.tsx",
  "components/QuizCard.tsx",
  "components/SectionHeader.tsx",
  "components/TokenRewardCard.tsx",
  "components/read-aloud-button.tsx",
  "components/ui/badge.tsx",
  "components/ui/button.tsx",
  "components/ui/card.tsx",
  "components/ui/dialog.tsx",
  "components/ui/progress.tsx",
  "components.json",
  "data/certificates.ts",
  "data/lessons.ts",
  "data/mockUser.ts",
  "data/quizQuestions.ts",
  "lib/inflation.ts",
  "lib/numerology.ts",
  "lib/solanaMock.ts",
  "lib/utils.ts",
  "next-env.d.ts",
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "postcss.config.mjs",
  "public/coach-fi-avatar.svg",
  "README.md",
  "START_COACHFI.cmd",
  "tailwind.config.ts",
  "tsconfig.json",
  "docs/DOCUMENTATION_ANALYSIS.md",
  "docs/MVP_SPEC.md",
  "docs/PROJECT_DOCUMENTATION.md",
  "docs/source/CoachFI-final-7slides-duplicate-original-name.pptx",
  "docs/source/CoachFI-final-7slides.pptx",
  "docs/source/CoachFI-pitch-deck-9slides.pptx"
];

for (const file of required) {
  readFileSync(join(root, file));
}

console.log(`CoachFi check passed: ${required.length} files present.`);
