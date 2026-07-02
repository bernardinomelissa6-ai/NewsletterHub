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
 * Weighted average: Central Director = 50%, Director 1 = 25%, Director 2 = 25%
 * Score ranges: 1.00–1.49 = Bronze, 1.50–2.49 = Silver, 2.50–3.49 = Gold, 3.50–4.00 = Special
 */
export function calculateFinalMedal(evaluations: DirectorEvaluationInput[]): FinalMedalResult {
  const central = evaluations.find((e) => e.isCentralDirector);
  const others = evaluations.filter((e) => !e.isCentralDirector);

  if (!central) throw new Error("Avaliação do Diretor Central não encontrada");
  if (others.length < 2) throw new Error("São necessárias avaliações de pelo menos 2 Diretores");

  const centralVal = MEDAL_VALUES[central.medal];
  const dir1Val = MEDAL_VALUES[others[0].medal];
  const dir2Val = MEDAL_VALUES[others[1].medal];

  const score = Number((centralVal * 0.5 + dir1Val * 0.25 + dir2Val * 0.25).toFixed(2));
  return { score, finalMedal: scoreToMedal(score) };
}
