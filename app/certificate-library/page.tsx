"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { certificateArt } from "@/lib/certificate-art";

const copy = {
  pl: { title: "Biblioteka certyfikatów", intro: "Trzy grafiki kolekcji Coach FI. Oglądanie grafiki nie oznacza posiadania NFT ani ukończenia etapu.", back: "Wróć do nagród", download: "Otwórz grafikę", badge: "Grafika edukacyjna · Devnet demo" },
  en: { title: "Certificate library", intro: "Three artworks from the Coach FI collection. Viewing artwork does not imply NFT ownership or completion of a learning stage.", back: "Back to rewards", download: "Open artwork", badge: "Education artwork · Devnet demo" },
  ja: { title: "証明書ライブラリ", intro: "Coach FI コレクションの3つの作品です。作品の表示はNFTの所有や学習完了を意味しません。", back: "報酬に戻る", download: "作品を開く", badge: "教育用作品 · Devnet デモ" },
};

export default function CertificateLibraryPage() {
  const { locale } = useLanguage();
  const text = copy[locale];
  return (
    <section aria-labelledby="library-title" className="space-y-6">
      <Link href="/rewards" className="font-bold text-primary underline">← {text.back}</Link>
      <div><h1 id="library-title" className="text-3xl font-black">{text.title}</h1><p className="mt-3 max-w-2xl text-muted">{text.intro}</p></div>
      <div className="grid gap-6 md:grid-cols-3">
        {certificateArt.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl border border-primary/15 bg-white shadow-soft">
            <Image src={item.image} alt={item.label[locale]} width={1254} height={1254} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-square w-full object-cover" />
            <div className="space-y-3 p-5"><p className="text-xs font-bold text-muted">{text.badge}</p><h2 className="text-xl font-black">{item.name}</h2><p>{item.label[locale]}</p><a href={item.image} target="_blank" rel="noopener noreferrer" className="inline-block font-bold text-primary underline">{text.download} ↗</a></div>
          </article>
        ))}
      </div>
    </section>
  );
}
