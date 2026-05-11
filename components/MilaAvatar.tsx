"use client";

import { motion } from "framer-motion";
import { useId } from "react";

import { useLanguage } from "@/context/LanguageContext";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface MilaAvatarProps {
  className?: string;
  isSpeaking?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-10 w-10",
  md: "h-36 w-36",
  lg: "h-56 w-56",
};

const avatarCopy: Record<Locale, { speaking: string; idle: string }> = {
  pl: { speaking: "Mila mówi", idle: "Avatar Mili, coacha finansowego AI" },
  en: { speaking: "Mila is speaking", idle: "Mila AI financial coach avatar" },
  ja: { speaking: "Milaが話しています", idle: "Mila AI金融コーチのアバター" },
};

export function MilaAvatar({ className, isSpeaking = false, size = "md" }: MilaAvatarProps) {
  const { locale } = useLanguage();
  const copy = avatarCopy[locale];
  const id = useId().replace(/:/g, "");
  const compact = size === "sm";
  const panelId = `mila-panel-${id}`;
  const faceId = `mila-face-${id}`;
  const suitId = `mila-suit-${id}`;
  const glowId = `mila-glow-${id}`;

  return (
    <div
      role="img"
      aria-label={isSpeaking ? copy.speaking : copy.idle}
      className={cn("relative shrink-0", sizes[size], className)}
    >
      <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <defs>
          <linearGradient id={panelId} x1="36" y1="21" x2="211" y2="222" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="0.48" stopColor="#EEF2FF" />
            <stop offset="1" stopColor="#DFF7F6" />
          </linearGradient>
          <linearGradient id={faceId} x1="80" y1="54" x2="158" y2="146" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE7C7" />
            <stop offset="1" stopColor="#D99465" />
          </linearGradient>
          <linearGradient id={suitId} x1="57" y1="151" x2="190" y2="226" gradientUnits="userSpaceOnUse">
            <stop stopColor="#111827" />
            <stop offset="0.55" stopColor="#29236E" />
            <stop offset="1" stopColor="#075E61" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop stopColor="#7DD3FC" stopOpacity="0.62" />
            <stop offset="1" stopColor="#5B4AE6" stopOpacity="0" />
          </radialGradient>
          <filter id={`soft-shadow-${id}`} x="-20%" y="-20%" width="140%" height="150%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="20" stdDeviation="18" floodColor="#111827" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect x="12" y="12" width="216" height="216" rx="44" fill={`url(#${panelId})`} />
        <rect x="13.5" y="13.5" width="213" height="213" rx="42.5" stroke="#5B4AE6" strokeOpacity="0.16" strokeWidth="3" />
        <path d="M38 184C77 207 153 208 203 165" stroke="#0F766E" strokeOpacity="0.13" strokeWidth="14" strokeLinecap="round" />
        <path d="M43 58C76 34 135 29 190 59" stroke="#5B4AE6" strokeOpacity="0.11" strokeWidth="12" strokeLinecap="round" />

        {isSpeaking && !compact && (
          <motion.rect
            x="31"
            y="28"
            width="178"
            height="184"
            rx="46"
            stroke="#5B4AE6"
            strokeWidth="2"
            strokeOpacity="0.22"
            animate={{ scale: [0.985, 1.012, 0.985], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "120px 120px" }}
          />
        )}

        <g filter={`url(#soft-shadow-${id})`}>
          <path d="M54 220C60 174 84 149 120 149C157 149 181 174 187 220H54Z" fill={`url(#${suitId})`} />
          <path d="M90 159L120 196L151 159L142 220H99L90 159Z" fill="#F8FAFC" />
          <path d="M107 166L120 194L134 166" stroke="#5B4AE6" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

          <rect x="93" y="126" width="54" height="36" rx="18" fill="#D99465" />
          <path d="M75 92C75 60 94 42 122 42C151 42 169 61 169 94C169 130 149 154 121 154C93 154 75 130 75 92Z" fill={`url(#${faceId})`} />

          <path d="M73 95C63 66 82 39 113 32C149 24 178 48 180 86C156 65 111 61 82 82C77 97 78 119 86 140C78 130 73 114 73 95Z" fill="#111827" />
          <path d="M166 84C184 100 184 128 165 148C171 127 172 104 166 84Z" fill="#111827" />
          <path d="M78 92C65 109 66 134 82 151C77 132 75 112 82 89L78 92Z" fill="#111827" />

          <path d="M68 104C59 104 52 112 52 122V139C52 149 59 157 68 157H76V104H68Z" fill="#29236E" />
          <path d="M172 104C181 104 188 112 188 122V139C188 149 181 157 172 157H164V104H172Z" fill="#29236E" />
          <path d="M71 104C73 63 92 42 121 42C150 42 169 63 171 104" stroke="#29236E" strokeWidth="7" strokeLinecap="round" />
          <path d="M166 154C160 168 149 175 131 176" stroke="#29236E" strokeWidth="6" strokeLinecap="round" />
          <circle cx="129" cy="176" r="4.5" fill="#0F172A" />

          <path d="M86 96C93 91 102 91 109 96" stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M131 96C138 91 147 91 154 96" stroke="#111827" strokeWidth="3.4" strokeLinecap="round" />
          <ellipse cx="98" cy="108" rx="8" ry="5.5" fill="#0F172A" />
          <ellipse cx="142" cy="108" rx="8" ry="5.5" fill="#0F172A" />
          <circle cx="101" cy="106" r="1.8" fill="#FFFFFF" />
          <circle cx="145" cy="106" r="1.8" fill="#FFFFFF" />
          <path d="M118 114C114 121 115 126 121 127" stroke="#B97047" strokeWidth="3" strokeLinecap="round" />

          <motion.path
            d={isSpeaking ? "M108 140C114 147 127 147 134 140C129 151 114 151 108 140Z" : "M108 140C114 146 127 146 134 140"}
            fill={isSpeaking ? "#111827" : "none"}
            stroke="#111827"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            animate={isSpeaking ? { scaleY: [0.72, 1.22, 0.84, 1.12, 0.72] } : { scaleY: 1 }}
            transition={isSpeaking ? { duration: 0.42, repeat: Infinity, ease: "easeInOut" } : { duration: 0.16 }}
            style={{ transformOrigin: "121px 143px" }}
          />

          {!compact && (
            <g>
              <rect x="154" y="170" width="38" height="38" rx="13" fill="#0F172A" />
              <path d="M164 191L171 198L181 181" stroke="#67E8F9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M163 177H183" stroke="#A5B4FC" strokeWidth="3" strokeLinecap="round" opacity="0.65" />
            </g>
          )}
        </g>

        {!compact && (
          <g>
            <rect x="71" y="194" width="54" height="24" rx="12" fill="#FFFFFF" fillOpacity="0.72" />
            {[84, 94, 104, 114].map((x, index) => (
              <motion.rect
                key={x}
                x={x}
                width="5"
                rx="2.5"
                fill={isSpeaking ? "#5B4AE6" : "#94A3B8"}
                animate={isSpeaking ? { y: [207, 199, 205], height: [6, 18, 10] } : { y: 204, height: 10 }}
                transition={{ duration: 0.54, repeat: isSpeaking ? Infinity : 0, delay: index * 0.07, ease: "easeInOut" }}
              />
            ))}
            <circle cx="120" cy="119" r="74" fill={`url(#${glowId})`} opacity="0.18" />
          </g>
        )}
      </svg>
    </div>
  );
}
