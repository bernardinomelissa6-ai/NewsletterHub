import type { MedalType } from "@/lib/supabase/types";

const MEDAL_VALUES: Record<MedalType, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  SPECIAL: 4,
};

function scoreToMedal(score: number): MedalType {
  if (score >= 3.5) return "SPECIAL";
  if (score >= 2.5) return "GOLD";
  if (score >= 1.5) return "SILVER";
  return "BRONZE";
}

export interface DirectorEvaluationInput {
  medal: MedalType;
  isCentralDirector: boolean;
}

export interface FinalMedalResult {
  score: number;
  finalMedal: MedalType;
}

/**
 * Weighted average: Central Director = 50%, all regular Directors collectively = 50%
 * If multiple directors evaluated, their medals are averaged before applying the 50% weight.
 * Score ranges: 1.00–1.49 = Bronze, 1.50–2.49 = Silver, 2.50–3.49 = Gold, 3.50–4.00 = Special
 */
export function calculateFinalMedal(evaluations: DirectorEvaluationInput[]): FinalMedalResult {
  const central = evaluations.find((e) => e.isCentralDirector);
  const others = evaluations.filter((e) => !e.isCentralDirector);

  if (!central) throw new Error("Avaliação do Diretor Central não encontrada");
  if (others.length < 1) throw new Error("É necessária avaliação de pelo menos 2 Diretores");

  const centralVal = MEDAL_VALUES[central.medal];
  const avgDirectors = others.reduce((sum, e) => sum + MEDAL_VALUES[e.medal], 0) / others.length;

  const score = Number((centralVal * 0.5 + avgDirectors * 0.5).toFixed(2));
  return { score, finalMedal: scoreToMedal(score) };
}
