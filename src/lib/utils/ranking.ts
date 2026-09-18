import type { MedalType } from "@/lib/supabase/types";

export const MEDAL_POINTS: Record<MedalType, number> = {
  SPECIAL: 10,
  GOLD: 7,
  SILVER: 5,
  BRONZE: 3,
};

export const MEDAL_LABELS: Record<MedalType, string> = {
  SPECIAL: "Especial",
  GOLD: "Ouro",
  SILVER: "Prata",
  BRONZE: "Bronze",
};

export const MEDAL_COLORS: Record<MedalType, string> = {
  SPECIAL: "text-purple-600 bg-purple-100",
  GOLD: "text-yellow-600 bg-yellow-100",
  SILVER: "text-gray-600 bg-gray-100",
  BRONZE: "text-orange-600 bg-orange-100",
};

export const MEDAL_BORDER_COLORS: Record<MedalType, string> = {
  SPECIAL: "border-purple-400",
  GOLD: "border-yellow-400",
  SILVER: "border-gray-400",
  BRONZE: "border-orange-400",
};

export function calculateScore(medals: { medal: MedalType }[]): number {
  return medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal], 0);
}

export interface CollaboratorScore {
  userId: string;
  name: string;
  areaId: string | null;
  areaName: string | null;
  score: number;
  specialCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
  totalCompliments: number;
  totalTrainings: number;
}

// Ranked by medal tier — like an Olympic medal table: most Especial wins,
// ties broken by Ouro, then Prata, then Bronze. No abstract point score involved.
// Collaborators with identical medal counts are true ties — the only remaining
// comparison (name) is just for a stable, predictable display order, never a
// tiebreaker implying one actually ranks above the other (see computeRanks).
export function sortCollaborators(collaborators: CollaboratorScore[]): CollaboratorScore[] {
  return [...collaborators].sort((a, b) => {
    if (b.specialCount !== a.specialCount) return b.specialCount - a.specialCount;
    if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
    if (b.silverCount !== a.silverCount) return b.silverCount - a.silverCount;
    if (b.bronzeCount !== a.bronzeCount) return b.bronzeCount - a.bronzeCount;
    return a.name.localeCompare(b.name);
  });
}

interface MedalCounts {
  specialCount: number;
  goldCount: number;
  silverCount: number;
  bronzeCount: number;
}

// Standard competition ranking (1224): entries with the same medal counts
// share the same position, and the next distinct entry skips accordingly
// (1º, 1º, 3º — never 1º, 1º, 2º). `sorted` must already be sorted by medal tier.
export function computeRanks<T extends MedalCounts>(sorted: T[]): number[] {
  const ranks: number[] = [];
  sorted.forEach((item, i) => {
    if (i === 0) {
      ranks.push(1);
      return;
    }
    const prev = sorted[i - 1];
    const tied =
      item.specialCount === prev.specialCount &&
      item.goldCount === prev.goldCount &&
      item.silverCount === prev.silverCount &&
      item.bronzeCount === prev.bronzeCount;
    ranks.push(tied ? ranks[i - 1] : i + 1);
  });
  return ranks;
}

