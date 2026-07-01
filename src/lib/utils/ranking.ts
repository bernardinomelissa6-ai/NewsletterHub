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

export function sortCollaborators(collaborators: CollaboratorScore[]): CollaboratorScore[] {
  return [...collaborators].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.specialCount !== a.specialCount) return b.specialCount - a.specialCount;
    if (b.goldCount !== a.goldCount) return b.goldCount - a.goldCount;
    if (b.totalCompliments !== a.totalCompliments) return b.totalCompliments - a.totalCompliments;
    return b.totalTrainings - a.totalTrainings;
  });
}

