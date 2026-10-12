interface LogoProps {
  size?: number | string;
  theme?: "light" | "dark" | "teen";
  showAI?: boolean;
  className?: string;
}

const fiBook = {
  light: "coachfi-fi-book.svg",
  dark: "coachfi-fi-book-dark.svg",
  teen: "coachfi-fi-book-teen.svg",
};

// CoachFI lockup (DESIGN.md §2.2): squirrel symbol whose tail is the "C" + live "oach" + FI book + "AI".
// Sized by font-size; everything else is in em. Place it on a flat background only.
export function Logo({ size = 32, theme = "light", showAI = true, className }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="CoachFI AI"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        fontFamily: "var(--cf-font-sans)",
        fontSize: size,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        lineHeight: 1,
        color: "var(--cf-text)",
      }}
    >
      <img
        src="/brand/logo/coachfi-symbol.svg"
        alt=""
        style={{ height: "1.3em", width: "auto", marginBottom: "0.08em", marginRight: "-0.02em" }}
      />
      <span aria-hidden>oach</span>
      <img
        src={`/brand/logo/${fiBook[theme]}`}
        alt=""
        style={{ height: "0.72em", width: "auto", marginBottom: "0.17em", marginLeft: "0.05em" }}
      />
      {showAI && (
        <span
          aria-hidden
          style={{
            alignSelf: "flex-start",
            margin: "0.14em 0 0 0.08em",
            fontSize: "0.26em",
            fontWeight: 700,
            color: "var(--cf-grape)",
          }}
        >
          AI
        </span>
      )}
    </span>
  );
}
