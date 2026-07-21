import type { MedalType } from "@/lib/supabase/types";

interface Colors {
  o1: string; o2: string; o3: string; // outer rosette
  i1: string; i2: string; i3: string; // inner circle
  r1: string; r2: string;             // ribbon
  teeth?: number;                     // rosette tooth count (default: sharp star)
  spikeDepth?: number;                // outer-to-inner radius gap of each tooth (default: deep)
  beadColor?: string;                 // beaded ring dot color (default: o1)
  ribbonTrim?: string;                // optional pinstripe outline color on the ribbon tails
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
    r1: "#E22B2B", r2: "#7A0000",
    teeth: 18, spikeDepth: 6, beadColor: "#FFE070", ribbonTrim: "#F8D840",
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

function beadPositions(cx: number, cy: number, r: number, n: number): Array<{ x: number; y: number }> {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

export function MedalIcon({ type, size = 72 }: { type: MedalType; size?: number }) {
  const c = CONFIGS[type];
  const t = type;

  // Viewport 100 x 132
  const cx = 50, cy = 50;
  const OR = 46;                        // outer tip of teeth
  const IR = OR - (c.spikeDepth ?? 10); // inner valley of teeth
  const CR = 32;                        // inner metallic circle
  const n = c.teeth ?? 28;              // number of teeth

  const rosette = rosettePath(cx, cy, OR, IR, n);
  const beads = beadPositions(cx, cy, CR + 3, Math.max(16, Math.round(n * 0.9)));
  const ry = cy + CR; // ribbon starts at bottom of inner circle = y 82
  const ribbonStroke = c.ribbonTrim ? { stroke: c.ribbonTrim, strokeWidth: 1.5, strokeLinejoin: "round" as const } : {};

  // Short, thick ribbon tails with a shallow V-notch (swallow tail)
  const RIB_TOP_W = 18;   // half-width where the ribbon meets the medal
  const RIB_TIP_W = 28;   // half-width at the bottom tip (flares outward)
  const RIB_LEN = 22;     // vertical length from attach point to tip
  const RIB_NOTCH_W = 11; // half-width of the inward notch point
  const RIB_NOTCH_UP = 8; // how far above the tip the notch point sits
  const viewH = ry + RIB_LEN + 6;

  return (
    <svg
      width={size}
      height={Math.round(size * (viewH / 100))}
      viewBox={`0 0 100 ${viewH}`}
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

      {/* ── Left ribbon ── short, thick tail with V-notch at bottom */}
      <path
        d={`M${cx},${ry} L${cx - RIB_TOP_W},${ry + 2} L${cx - RIB_TIP_W},${ry + RIB_LEN} L${cx - RIB_NOTCH_W},${ry + RIB_LEN - RIB_NOTCH_UP} Z`}
        fill={`url(#rrl-${t})`}
        {...ribbonStroke}
      />
      {/* ── Right ribbon ── mirror */}
      <path
        d={`M${cx},${ry} L${cx + RIB_TOP_W},${ry + 2} L${cx + RIB_TIP_W},${ry + RIB_LEN} L${cx + RIB_NOTCH_W},${ry + RIB_LEN - RIB_NOTCH_UP} Z`}
        fill={`url(#rrr-${t})`}
        {...ribbonStroke}
      />

      {/* ── Outer serrated rosette ring ── */}
      <path d={rosette} fill={`url(#ro-${t})`} />

      {/* ── Decorative inner ring (slightly darker than circle) ── */}
      <circle cx={cx} cy={cy} r={CR + 3} fill={c.o2} />

      {/* ── Beaded ring ── */}
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={1.4} fill={c.beadColor ?? c.o1} />
      ))}

      {/* ── Main metallic inner circle ── */}
      <circle cx={cx} cy={cy} r={CR} fill={`url(#ri-${t})`} />

      {/* ── Specular highlight ── */}
      <ellipse cx={cx - 9} cy={cy - 10} rx={11} ry={8} fill="white" opacity="0.20" />
    </svg>
  );
}
