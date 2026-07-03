import type { MedalType } from "@/lib/supabase/types";

const MEDAL_VALUES: Record<MedalType, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  SPECIAL: 4,
};

export interface DirectorEvaluationInput {
  medal: MedalType;
  isCentralDirector: boolean;
}

export interface FinalMedalResult {
  score: number;
  finalMedal: MedalType;
}

/**
 * Weights: Director 1 = 33.33%, Director 2 = 33.33%, Central Director = 33.34%
 * Score = simple average of all 3 votes (each contributes 1/3).
 *
 * Medal rule:
 * - If all regular directors agree → their medal is final
 * - If regular directors disagree → Central Director breaks the tie (Central's medal is final)
 */
export function calculateFinalMedal(evaluations: DirectorEvaluationInput[]): FinalMedalResult {
  const central = evaluations.find((e) => e.isCentralDirector);
  const regulars = evaluations.filter((e) => !e.isCentralDirector);

  if (!central) throw new Error("Avaliação do Diretor Central não encontrada");
  if (regulars.length < 2) throw new Error("É necessária avaliação de pelo menos 2 Diretores");

  // Score: equal weight across all evaluators (1/3 each)
  const all = [...regulars, central];
  const score = Number(
    (all.reduce((sum, e) => sum + MEDAL_VALUES[e.medal], 0) / all.length).toFixed(2)
  );

  // Medal: regular directors in agreement → their medal; otherwise Central breaks the tie
  const regularsAgree = regulars.every((e) => e.medal === regulars[0].medal);
  const finalMedal = regularsAgree ? regulars[0].medal : central.medal;

  return { score, finalMedal };
}
