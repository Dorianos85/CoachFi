import type { Metadata, Viewport } from "next";
import { Noto_Sans, Nunito } from "next/font/google";

import { AppNavigation } from "@/components/AppNavigation";
import { MilaVoiceFab } from "@/components/MilaVoiceAgent";

import "./globals.css";
import { Providers } from "./providers";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const notoSans = Noto_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Coach FI - Financial Education",
  description:
    "Build saving habits, understand inflation, investing and long-term financial confidence with AI coach Mila.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/app-icons/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/app-icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/app-icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/app-icons/favicon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coach FI",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Coach FI - Financial Education",
    description:
      "Learn saving, credit and investing through simulations, quizzes and daily steps with AI coach Mila.",
    siteName: "Coach FI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#EBE1FF",
};

// v6 "pastel" theme is on by default; NEXT_PUBLIC_DESIGN_V6=0 switches back to the pre-v6 palette.
const designTheme = process.env.NEXT_PUBLIC_DESIGN_V6 === "0" ? "legacy" : "adult-light";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme={designTheme}
      suppressHydrationWarning
      className={`${nunito.variable} ${notoSans.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppNavigation>{children}</AppNavigation>
          <MilaVoiceFab />
        </Providers>
      </body>
    </html>
  );
}
