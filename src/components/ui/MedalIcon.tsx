import type { MedalType } from "@/lib/supabase/types";

interface Colors {
  o1: string; o2: string; o3: string; // outer rosette
  i1: string; i2: string; i3: string; // inner circle
  r1: string; r2: string;             // ribbon
}

const CONFIGS: Record<MedalType, Colors> = {
  BRONZE: {
    o1: "#D4956A", o2: "#9B6234", o3: "#6B3E18",
    i1: "#F0C090", i2: "#C47840", i3: "#8B5220",
    r1: "#C47030", r2: "#7A3C10",
  },
  SILVER: {
    o1: "#EBEBEB", o2: "#ADADAD", o3: "#787878",
    i1: "#FFFFFF", i2: "#D0D0D0", i3: "#909090",
    r1: "#CCCCCC", r2: "#888888",
  },
  GOLD: {
    o1: "#F8D840", o2: "#C89800", o3: "#806000",
    i1: "#FFF0A0", i2: "#E8B800", i3: "#A07800",
    r1: "#E0A800", r2: "#805800",
  },
  SPECIAL: {
    o1: "#F8D840", o2: "#C89800", o3: "#806000",
    i1: "#FFF0A0", i2: "#E8B800", i3: "#A07800",
    r1: "#7B1FA2", r2: "#48086F",
  },
};

function rosettePath(cx: number, cy: number, R: number, r: number, n: number): string {
  let d = "";
  const total = n * 2;
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    const x = (cx + Math.cos(a) * radius).toFixed(2);
    const y = (cy + Math.sin(a) * radius).toFixed(2);
    d += i === 0 ? `M${x},${y}` : `L${x},${y}`;
  }
  return d + "Z";
}

export function MedalIcon({ type, size = 72 }: { type: MedalType; size?: number }) {
  const c = CONFIGS[type];
  const t = type;

  // Viewport 100 x 132
  const cx = 50, cy = 50;
  const OR = 46;   // outer tip of teeth
  const IR = 36;   // inner valley of teeth (10px teeth = very visible)
  const CR = 32;   // inner metallic circle
  const n  = 28;   // number of teeth

  const rosette = rosettePath(cx, cy, OR, IR, n);
  const ry = cy + CR; // ribbon starts at bottom of inner circle = y 82

  return (
    <svg
      width={size}
      height={Math.round(size * 1.32)}
      viewBox="0 0 100 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Outer rosette gradient */}
        <radialGradient id={`ro-${t}`} cx="42%" cy="36%" r="64%">
          <stop offset="0%"   stopColor={c.o1} />
          <stop offset="60%"  stopColor={c.o2} />
          <stop offset="100%" stopColor={c.o3} />
        </radialGradient>

        {/* Inner circle gradient — bright center, darker edge */}
        <radialGradient id={`ri-${t}`} cx="38%" cy="30%" r="70%">
          <stop offset="0%"   stopColor={c.i1} />
          <stop offset="50%"  stopColor={c.i2} />
          <stop offset="100%" stopColor={c.i3} />
        </radialGradient>

        {/* Ribbon left gradient */}
        <linearGradient id={`rrl-${t}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={c.r2} />
          <stop offset="100%" stopColor={c.r1} />
        </linearGradient>

        {/* Ribbon right gradient */}
        <linearGradient id={`rrr-${t}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={c.r1} />
          <stop offset="100%" stopColor={c.r2} />
        </linearGradient>
      </defs>

      {/* ── Left ribbon ── wide trapezoid with V-notch at bottom */}
      <path
        d={`M${cx},${ry} L${cx - 16},${ry + 2} L${cx - 32},128 L${cx - 14},114 Z`}
        fill={`url(#rrl-${t})`}
      />
      {/* ── Right ribbon ── mirror */}
      <path
        d={`M${cx},${ry} L${cx + 16},${ry + 2} L${cx + 32},128 L${cx + 14},114 Z`}
        fill={`url(#rrr-${t})`}
      />

      {/* ── Outer serrated rosette ring ── */}
      <path d={rosette} fill={`url(#ro-${t})`} />

      {/* ── Decorative inner ring (slightly darker than circle) ── */}
      <circle cx={cx} cy={cy} r={CR + 2} fill={c.o2} />

      {/* ── Main metallic inner circle ── */}
      <circle cx={cx} cy={cy} r={CR} fill={`url(#ri-${t})`} />

      {/* ── Specular highlight ── */}
      <ellipse cx={cx - 9} cy={cy - 10} rx={11} ry={8} fill="white" opacity="0.20" />
    </svg>
  );
}
