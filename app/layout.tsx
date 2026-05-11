import type { Metadata, Viewport } from "next";
import { Noto_Sans, Nunito } from "next/font/google";

import { AppNavigation } from "@/components/AppNavigation";

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
  title: "Coach FI - Mapa Finansowa",
  description:
    "Aplikacja do oszczedzania, nauki inwestowania, kredytow i dlugoterminowej pewnosci finansowej.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coach FI",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    title: "Coach FI - Mapa Finansowa",
    description:
      "Ucz sie oszczedzania, kredytow i inwestowania przez decyzje, symulatory i codzienne kroki.",
    siteName: "Coach FI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  themeColor: "#7668E8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${nunito.variable} ${notoSans.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppNavigation>{children}</AppNavigation>
        </Providers>
      </body>
    </html>
  );
}
