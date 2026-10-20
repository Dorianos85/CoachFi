"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function LearningPathNavigation() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const pl = locale === "pl";
  const items = [
    { href: "/", label: pl ? "Wybierz ścieżkę" : "Choose a path", active: pathname === "/" },
    { href: "/adult", label: pl ? "Dla dorosłych" : "For adults", active: pathname.startsWith("/adult") ||
      !["/", "/terms", "/privacy"].includes(pathname) && !pathname.startsWith("/family") },
    { href: "/family", label: pl ? "Dla rodziny" : "For families", active: pathname === "/family" || pathname.startsWith("/family/") },
  ];
  return <nav aria-label={pl ? "Ścieżki nauki" : "Learning paths"} className="flex flex-wrap gap-2">
    {items.map((item) => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined}
      className={cn("inline-flex min-h-11 items-center rounded-lg border border-primary/20 px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        item.active ? "bg-primary text-on-primary" : "bg-surface text-text hover:bg-primary/10")}>
      {item.label}
    </Link>)}
  </nav>;
}
