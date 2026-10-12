export const certificateArt = [
  { id: "money-mindset", name: "Money Mindset", image: "/nft-art/money-mindset.png", label: { pl: "Świadomość finansowa", en: "Financial awareness", ja: "お金への理解" } },
  { id: "saving-habit", name: "Saving Habit", image: "/nft-art/saving-habit.png", label: { pl: "Nawyk oszczędzania", en: "Saving habit", ja: "貯蓄習慣" } },
  { id: "inflation-fighter", name: "Inflation Fighter", image: "/nft-art/inflation-fighter.png", label: { pl: "Rozumienie inflacji", en: "Understanding inflation", ja: "インフレの理解" } },
] as const;

export function findCertificateArt(name: string) {
  const normalized = name.toLowerCase().replace(/[-_]/g, " ").replace(/\s+certificate$/, "").trim();
  return certificateArt.find((item) => item.name.toLowerCase() === normalized);
}
