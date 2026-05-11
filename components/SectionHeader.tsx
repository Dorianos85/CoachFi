import { ReadAloudButton } from "@/components/read-aloud-button";

export function SectionHeader({
  eyebrow,
  title,
  description,
  readText
}: {
  eyebrow: string;
  title: string;
  description: string;
  readText: string;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="max-w-3xl">
        <p className="mb-3 inline-flex rounded-lg border border-primary/15 bg-white/70 px-3 py-1 text-xs font-black uppercase tracking-normal text-primary shadow-sm">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-black leading-[1.02] text-text md:text-5xl break-words hyphens-auto">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted md:text-lg break-words">{description}</p>
      </div>
      <ReadAloudButton text={readText} />
    </div>
  );
}
