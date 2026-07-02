import type { MedalType } from "@/lib/supabase/types";

interface Colors {
  o1: string; o2: string; // outer rosette gradient
  i1: string; i2: string; // inner circle gradient
  r1: string; r2: string; // ribbon gradient
}

const CONFIGS: Record<MedalType, Colors> = {
  BRONZE:  { o1: "#D4956A", o2: "#7A4520", i1: "#EDBA8A", i2: "#9B6234", r1: "#C47030", r2: "#7A4520" },
  SILVER:  { o1: "#E2E2E2", o2: "#8A8A8A", i1: "#F6F6F6", i2: "#ADADAD", r1: "#CACACA", r2: "#8A8A8A" },
  GOLD:    { o1: "#F4CC34", o2: "#9A7200", i1: "#FFE466", i2: "#C89800", r1: "#E2B000", r2: "#906800" },
  SPECIAL: { o1: "#F4CC34", o2: "#9A7200", i1: "#FFE466", i2: "#C89800", r1: "#E83232", r2: "#900000" },
};

function rosettePath(cx: number, cy: number, R: number, r: number, n: number): string {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    const x = (cx + Math.cos(a) * radius).toFixed(2);
    const y = (cy + Math.sin(a) * radius).toFixed(2);
    d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
  }
  return d + "Z";
}

export function MedalIcon({ type, size = 60 }: { type: MedalType; size?: number }) {
  const c = CONFIGS[type];
  const t = type;
  const cx = 35, cy = 36;
  const path = rosettePath(cx, cy, 29, 23, 20);

  return (
    <svg
      width={size}
      height={Math.round(size * 1.28)}
      viewBox="0 0 70 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`mo-${t}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor={c.o1} />
          <stop offset="100%" stopColor={c.o2} />
        </radialGradient>
        <radialGradient id={`mi-${t}`} cx="36%" cy="28%" r="72%">
          <stop offset="0%" stopColor={c.i1} />
          <stop offset="100%" stopColor={c.i2} />
        </radialGradient>
        <linearGradient id={`mrl-${t}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={c.r1} />
          <stop offset="100%" stopColor={c.r2} />
        </linearGradient>
        <linearGradient id={`mrr-${t}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c.r1} />
          <stop offset="100%" stopColor={c.r2} />
        </linearGradient>
      </defs>

      {/* Left ribbon */}
      <path d="M35,56 L26,56 L12,88 L25,77 Z" fill={`url(#mrl-${t})`} />
      {/* Right ribbon */}
      <path d="M35,56 L44,56 L58,88 L45,77 Z" fill={`url(#mrr-${t})`} />

      {/* Outer serrated rosette */}
      <path d={path} fill={`url(#mo-${t})`} />

      {/* Inner metallic circle */}
      <circle cx={cx} cy={cy} r={20} fill={`url(#mi-${t})`} />

      {/* Subtle shine highlight */}
      <ellipse cx={cx - 5} cy={cy - 7} rx={7} ry={5} fill="white" opacity="0.22" />
    </svg>
  );
}
