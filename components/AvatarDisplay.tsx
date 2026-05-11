"use client";

import { useEffect, useState } from "react";
import { type AvatarData, type AvatarStyle, type AvatarGender, getAvatar } from "@/lib/avatar";
import { getAllStageProgress, type StageProgress } from "@/lib/learningProgress";
import { cn } from "@/lib/utils";

// ─── Style config ─────────────────────────────────────────────────────────────
const STYLE = {
  warrior: { body: "#6366F1", bodyDark: "#4338CA", bodyDarkest: "#312E81", bodyLight: "#818CF8", hair: "#1F2937", from: "#6C47FF", to: "#4338CA" },
  explorer: { body: "#34D399", bodyDark: "#059669", bodyDarkest: "#047857", bodyLight: "#6EE7B7", hair: "#78350F", from: "#10B981", to: "#059669" },
  builder: { body: "#FCD34D", bodyDark: "#D97706", bodyDarkest: "#B45309", bodyLight: "#FDE68A", hair: "#1F2937", from: "#F59E0B", to: "#D97706" },
};

const SKIN = "#FCD9A0";
const SKIN_SHADOW = "#E5A570";

// ─── SVG sub-components ───────────────────────────────────────────────────────

function Hair({ gender, style }: { gender: AvatarGender; style: AvatarStyle }) {
  const c = STYLE[style];
  if (gender === "male") {
    if (style === "warrior") return (
      <g>
        <path d="M62 78 C65 35 135 35 138 78 C128 56 72 56 62 78Z" fill={c.hair} />
        <path d="M64 68 C60 50 68 38 76 44 C70 54 72 62 64 68Z" fill={c.hair} />
        <path d="M136 68 C140 50 132 38 124 44 C130 54 128 62 136 68Z" fill={c.hair} />
      </g>
    );
    if (style === "explorer") return (
      <path d="M62 78 C64 35 136 35 138 78 C128 52 85 44 68 62 Z" fill={c.hair} />
    );
    // builder — hard hat
    return (
      <g>
        <path d="M62 79 C64 60 136 60 138 79 C128 65 72 65 62 79Z" fill={c.hair} />
        <ellipse cx="100" cy="54" rx="50" ry="19" fill={c.bodyDark} />
        <rect x="56" y="53" width="88" height="13" rx="5" fill={c.bodyDarkest} />
        <rect x="78" y="36" width="44" height="20" rx="10" fill={c.bodyDark} />
      </g>
    );
  }
  // female
  if (style === "warrior") return (
    <g>
      <path d="M62 78 C64 40 136 40 138 78 C128 55 72 55 62 78Z" fill={c.hair} />
      <circle cx="100" cy="43" r="20" fill={c.hair} />
      <circle cx="100" cy="36" r="10" fill={c.hair} />
    </g>
  );
  if (style === "explorer") return (
    <path
      d="M62 78 C59 94 53 142 57 172 C64 158 70 118 70 84 C75 40 125 40 130 84 C130 118 136 158 143 172 C147 142 141 94 138 78 C130 33 70 33 62 78Z"
      fill={c.hair}
    />
  );
  // builder female — ponytail + hard hat
  return (
    <g>
      <path d="M62 79 C64 60 136 60 138 79 C128 65 72 65 62 79Z" fill={c.hair} />
      <ellipse cx="100" cy="54" rx="50" ry="19" fill={c.bodyDark} />
      <rect x="56" y="53" width="88" height="13" rx="5" fill={c.bodyDarkest} />
      <rect x="78" y="36" width="44" height="20" rx="10" fill={c.bodyDark} />
      <path d="M136 76 C150 92 154 142 146 158" stroke={c.hair} strokeWidth="14" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Face({ gender, style }: { gender: AvatarGender; style: AvatarStyle }) {
  const eyeR = gender === "female" ? 8 : 7;
  const pupilR = gender === "female" ? 5 : 4.5;
  const eyeY = 78;
  const hairColor = STYLE[style].hair;

  const eyebrows = style === "warrior"
    ? <><path d="M80 66 Q87 61 94 66" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" fill="none" /><path d="M106 66 Q113 61 120 66" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" fill="none" /></>
    : style === "explorer"
    ? <><path d="M80 65 Q87 60 93 65" stroke={hairColor} strokeWidth="2" strokeLinecap="round" fill="none" /><path d="M107 65 Q113 60 120 65" stroke={hairColor} strokeWidth="2" strokeLinecap="round" fill="none" /></>
    : <><line x1="80" y1="65" x2="94" y2="63" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" /><line x1="106" y1="63" x2="120" y2="65" stroke={hairColor} strokeWidth="2.5" strokeLinecap="round" /></>;

  const mouth = style === "warrior"
    ? <path d="M91 98 Q100 101 109 98" stroke={SKIN_SHADOW} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    : style === "explorer"
    ? <path d="M89 97 Q100 107 111 97" stroke={SKIN_SHADOW} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    : <path d="M90 98 Q100 104 110 98" stroke={SKIN_SHADOW} strokeWidth="2.5" fill="none" strokeLinecap="round" />;

  return (
    <g>
      {eyebrows}
      {/* Left eye */}
      <circle cx="87" cy={eyeY} r={eyeR} fill="white" />
      <circle cx="89" cy={eyeY} r={pupilR} fill="#1a1a2e" />
      <circle cx="90.5" cy={eyeY - 1} r="1.5" fill="white" />
      {/* Right eye */}
      <circle cx="113" cy={eyeY} r={eyeR} fill="white" />
      <circle cx="115" cy={eyeY} r={pupilR} fill="#1a1a2e" />
      <circle cx="116.5" cy={eyeY - 1} r="1.5" fill="white" />
      {/* Female lashes */}
      {gender === "female" && (
        <g stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round">
          <line x1="79" y1="72" x2="76" y2="68" />
          <line x1="84" y1="70" x2="83" y2="66" />
          <line x1="89" y1="69" x2="89" y2="65" />
          <line x1="108" y1="69" x2="108" y2="65" />
          <line x1="113" y1="70" x2="114" y2="66" />
          <line x1="121" y1="72" x2="124" y2="68" />
        </g>
      )}
      {/* Nose */}
      <circle cx="96" cy="89" r="3" fill="rgba(0,0,0,0.07)" />
      <circle cx="104" cy="89" r="3" fill="rgba(0,0,0,0.07)" />
      {/* Blush (female) */}
      {gender === "female" && (
        <>
          <circle cx="74" cy="90" r="10" fill="#F87171" opacity="0.18" />
          <circle cx="126" cy="90" r="10" fill="#F87171" opacity="0.18" />
        </>
      )}
      {mouth}
    </g>
  );
}

function Accessory({ style }: { style: AvatarStyle }) {
  if (style === "warrior") return (
    <g>
      <rect x="160" y="102" width="7" height="88" rx="3" fill="#CBD5E1" />
      <rect x="148" y="120" width="25" height="7" rx="3" fill="#8B5CF6" />
      <rect x="157" y="95" width="13" height="15" rx="4" fill="#F59E0B" />
      <ellipse cx="163.5" cy="93" rx="5" ry="4" fill="#F59E0B" />
    </g>
  );
  if (style === "explorer") return (
    <g>
      <circle cx="163" cy="170" r="22" fill="#E5E7EB" stroke={STYLE.explorer.body} strokeWidth="3" />
      <circle cx="163" cy="170" r="16" fill="white" />
      <polygon points="163,155 167,170 163,185 159,170" fill={STYLE.explorer.bodyDark} />
      <polygon points="163,155 159,170 163,185 167,170" fill="#EF4444" />
      <circle cx="163" cy="170" r="3" fill="#374151" />
    </g>
  );
  // builder — wrench
  return (
    <g transform="rotate(-22 164 160)">
      <rect x="158" y="120" width="12" height="68" rx="5" fill="#9CA3AF" />
      <path d="M154 120 C149 107 177 107 172 120" fill="#9CA3AF" />
      <rect x="153" y="183" width="18" height="12" rx="4" fill="#9CA3AF" />
    </g>
  );
}

function AvatarFigureSVG({ gender, style }: { gender: AvatarGender; style: AvatarStyle }) {
  const c = STYLE[style];
  const bodyPath = gender === "male"
    ? "M36 142 C34 168 33 196 36 228 L164 228 C167 196 166 168 164 142Z"
    : "M42 142 C38 172 34 198 38 228 L162 228 C166 198 162 172 158 142Z";

  return (
    <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id={`bg-${style}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={c.from} stopOpacity="0.18" />
          <stop offset="100%" stopColor={c.to} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background glow */}
      <circle cx="100" cy="120" r="100" fill={`url(#bg-${style})`} />

      {/* Left arm */}
      <rect x="10" y="150" width="30" height="72" rx="12" fill={c.bodyDark} />
      {/* Right arm */}
      <rect x="160" y="150" width="30" height="72" rx="12" fill={c.bodyDark} />

      {/* Body */}
      <path d={bodyPath} fill={c.body} />

      {/* Chest emblem */}
      {style === "warrior" && (
        <path d="M88 157 L100 148 L112 157 L112 172 L100 180 L88 172Z" fill={c.bodyLight} opacity="0.6" />
      )}
      {style === "explorer" && (
        <g opacity="0.5">
          <circle cx="100" cy="164" r="15" fill="none" stroke="white" strokeWidth="2" />
          <line x1="100" y1="150" x2="100" y2="178" stroke="white" strokeWidth="1.5" />
          <line x1="86" y1="164" x2="114" y2="164" stroke="white" strokeWidth="1.5" />
        </g>
      )}
      {style === "builder" && (
        <g>
          <circle cx="100" cy="163" r="16" fill={c.bodyLight} opacity="0.4" />
          <text x="100" y="168" textAnchor="middle" fontSize="13" fill="white" fontWeight="bold">B</text>
        </g>
      )}

      {/* Belt */}
      <rect x="34" y="184" width="132" height="14" rx="6" fill={c.bodyDarkest} />
      <rect x="88" y="182" width="24" height="18" rx="5" fill={c.bodyDark} />

      {/* Legs */}
      <rect x="52" y="226" width="40" height="52" rx="12" fill={c.bodyDark} />
      <rect x="108" y="226" width="40" height="52" rx="12" fill={c.bodyDark} />

      {/* Feet */}
      <rect x="44" y="262" width="52" height="20" rx="10" fill={c.bodyDarkest} />
      <rect x="104" y="262" width="52" height="20" rx="10" fill={c.bodyDarkest} />

      {/* Shoulder pads (warrior) */}
      {style === "warrior" && (
        <g>
          <ellipse cx="40" cy="150" rx="24" ry="14" fill={c.body} />
          <ellipse cx="160" cy="150" rx="24" ry="14" fill={c.body} />
          <ellipse cx="40" cy="148" rx="18" ry="10" fill={c.bodyLight} />
          <ellipse cx="160" cy="148" rx="18" ry="10" fill={c.bodyLight} />
        </g>
      )}

      {/* Neck */}
      <rect x="82" y="115" width="36" height="28" rx="12" fill={SKIN} />

      {/* Head */}
      <circle cx="100" cy="80" r="42" fill={SKIN} />

      {/* Hair */}
      <Hair gender={gender} style={style} />

      {/* Face */}
      <Face gender={gender} style={style} />

      {/* Accessory */}
      <Accessory style={style} />
    </svg>
  );
}

// ─── Hexagonal Financial Shield ───────────────────────────────────────────────

const SHIELD_LABELS = ["Saving", "Investing", "Emergency", "Credit", "Streak", "Knowledge"];
const SHIELD_COLORS = ["#6C47FF", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#0EA5E9"];

function getShieldValues(stages: StageProgress[]): number[] {
  const ids = ["saving-habit", "long-term-investing", "emergency-fund", "credit-rates", "money-mindset", "inflation"];
  return ids.map((id) => {
    const s = stages.find((p) => p.stageId === id);
    if (!s) return 0;
    if (s.status === "completed") return 100;
    if (s.status === "inProgress") return Math.max(s.progressPct, 15);
    if (s.status === "current") return 10;
    return 0;
  });
}

function hexPoint(cx: number, cy: number, r: number, i: number, total: number): [number, number] {
  const angle = (i * 2 * Math.PI) / total - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function FinancialShield({ stages }: { stages: StageProgress[] }) {
  const CX = 120, CY = 115, MAX_R = 75, N = 6;
  const values = getShieldValues(stages);

  const gridPolygon = (scale: number) =>
    Array.from({ length: N }, (_, i) => hexPoint(CX, CY, MAX_R * scale, i, N))
      .map(([x, y]) => `${x},${y}`)
      .join(" ");

  const dataPoints = values.map((v, i) => hexPoint(CX, CY, (v / 100) * MAX_R, i, N));
  const dataPath = dataPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + "Z";

  return (
    <svg viewBox="0 0 240 230" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Financial shield radar chart">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={gridPolygon(s)} fill="none" stroke="#E5E7EB" strokeWidth={s === 1 ? 1.5 : 1} />
      ))}
      {/* Axes */}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = hexPoint(CX, CY, MAX_R, i, N);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />;
      })}
      {/* Data fill */}
      <path d={dataPath} fill="#6C47FF" fillOpacity="0.2" stroke="#6C47FF" strokeWidth="2.5" />
      {/* Data points */}
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={SHIELD_COLORS[i]} stroke="white" strokeWidth="1.5" />
      ))}
      {/* Labels */}
      {Array.from({ length: N }, (_, i) => {
        const [x, y] = hexPoint(CX, CY, MAX_R + 22, i, N);
        const value = values[i];
        return (
          <g key={i}>
            <text x={x} y={y - 5} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="bold" fill="#6B7280">
              {SHIELD_LABELS[i]}
            </text>
            <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle" fontSize="8" fill={SHIELD_COLORS[i]} fontWeight="bold">
              {value}%
            </text>
          </g>
        );
      })}
      {/* Center score */}
      <circle cx={CX} cy={CY} r="18" fill="#6C47FF" />
      <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="bold" fill="white">
        {Math.round(values.reduce((a, b) => a + b, 0) / values.length)}
      </text>
    </svg>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

interface AvatarDisplayProps {
  className?: string;
  showShield?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AvatarDisplay({ className, showShield = true, size = "md" }: AvatarDisplayProps) {
  const [avatar, setAvatar] = useState<AvatarData | null>(null);
  const [stages, setStages] = useState<StageProgress[]>([]);

  useEffect(() => {
    setAvatar(getAvatar());
    setStages(getAllStageProgress());
  }, []);

  if (!avatar) {
    return (
      <div className={cn("animate-pulse rounded-2xl bg-primary/8", size === "sm" ? "h-32 w-24" : "h-64 w-48", className)} />
    );
  }

  const styleInfo = { warrior: "Warrior", explorer: "Explorer", builder: "Builder" }[avatar.style];
  const figureW = size === "sm" ? "w-24" : size === "lg" ? "w-52" : "w-40";

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className={cn(figureW)}>
        <AvatarFigureSVG gender={avatar.gender} style={avatar.style} />
      </div>
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-wide text-primary">
          {avatar.gender === "male" ? "♂" : "♀"} {styleInfo}
        </p>
      </div>
      {showShield && (
        <div className="w-full max-w-[280px]">
          <p className="mb-1 text-center text-[10px] font-black uppercase tracking-wider text-muted">Financial Shield</p>
          <FinancialShield stages={stages} />
        </div>
      )}
    </div>
  );
}
