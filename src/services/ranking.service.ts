import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDAL_POINTS, sortCollaborators, type CollaboratorScore } from "@/lib/utils/ranking";
import { calculateFinalMedal } from "@/lib/utils/medal-calculation";
import type { MedalType } from "@/lib/supabase/types";

export interface RankingFilter {
  year?: number;
  quarter?: number;
  areaId?: string;
}

const isCentral = (role: string) => ["DIRETOR_CENTRAL", "ADMIN"].includes(role);

export async function getCollaboratorRanking(filter: RankingFilter = {}): Promise<CollaboratorScore[]> {
  const { year, quarter, areaId } = filter;

  // Manual query — avoid FK join area:areas(name) that can fail silently
  let usersQuery = supabaseAdmin
    .from("users")
    .select("id, name, area_id")
    .eq("role", "COLLABORATOR")
    .eq("is_active", true);
  if (areaId) usersQuery = usersQuery.eq("area_id", areaId);
  const { data: users } = await usersQuery;
  if (!users || users.length === 0) return [];

  const areaIds = [...new Set(users.map((u: any) => u.area_id).filter(Boolean))];
  const { data: areas } = areaIds.length > 0
    ? await supabaseAdmin.from("areas").select("id, name").in("id", areaIds)
    : { data: [] };
  const areaMap = new Map((areas ?? []).map((a: any) => [a.id, a.name as string]));

  const userIds = users.map((u: any) => u.id);

  let complimentsQuery = supabaseAdmin
    .from("compliments")
    .select("id, collaborator_id, final_medal")
    .eq("status", "AVALIADO")
    .in("collaborator_id", userIds);
  if (year) complimentsQuery = complimentsQuery.eq("year", year);
  if (quarter) complimentsQuery = complimentsQuery.eq("quarter", quarter);

  let trainingsQuery = supabaseAdmin
    .from("trainings")
    .select("collaborator_id")
    .in("collaborator_id", userIds);
  if (year) trainingsQuery = trainingsQuery.eq("year", year);
  if (quarter) trainingsQuery = trainingsQuery.eq("quarter", quarter);

  const [{ data: compliments }, { data: trainings }] = await Promise.all([complimentsQuery, trainingsQuery]);

  const medalsByUser = new Map<string, { medal: string }[]>();

  // Split: compliments with final_medal stored vs those needing fallback computation
  const withMedal = (compliments ?? []).filter((c: any) => c.final_medal);
  const withoutMedal = (compliments ?? []).filter((c: any) => !c.final_medal);

  for (const c of withMedal) {
    const list = medalsByUser.get(c.collaborator_id) ?? [];
    list.push({ medal: c.final_medal });
    medalsByUser.set(c.collaborator_id, list);
  }

  // Fallback: compute final medal from compliment_evaluations when final_medal is null
  if (withoutMedal.length > 0) {
    const ids = withoutMedal.map((c: any) => c.id);
    const { data: evals } = await supabaseAdmin
      .from("compliment_evaluations")
      .select("compliment_id, director_id, medal")
      .in("compliment_id", ids);

    const dirIds = [...new Set((evals ?? []).map((e: any) => e.director_id).filter(Boolean))];
    const { data: dirs } = dirIds.length > 0
      ? await supabaseAdmin.from("users").select("id, role").in("id", dirIds)
      : { data: [] };
    const roleMap = new Map((dirs ?? []).map((u: any) => [u.id, u.role as string]));

    for (const c of withoutMedal) {
      const complimentEvals = (evals ?? []).filter((e: any) => e.compliment_id === c.id);
      try {
        const { finalMedal } = calculateFinalMedal(
          complimentEvals.map((e: any) => ({
            medal: e.medal as MedalType,
            isCentralDirector: isCentral(roleMap.get(e.director_id) ?? ""),
          }))
        );
        const list = medalsByUser.get(c.collaborator_id) ?? [];
        list.push({ medal: finalMedal });
        medalsByUser.set(c.collaborator_id, list);
      } catch {
        // Not enough evaluations to compute final medal — skip
      }
    }
  }

  const trainingsByUser = new Map<string, number>();
  for (const t of trainings ?? []) {
    trainingsByUser.set(t.collaborator_id, (trainingsByUser.get(t.collaborator_id) ?? 0) + 1);
  }

  const scores: CollaboratorScore[] = users.map((user: any) => {
    const medals = medalsByUser.get(user.id) ?? [];
    const score = medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal as MedalType], 0);
    const medalCounts = { SPECIAL: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
    for (const { medal } of medals) medalCounts[medal as keyof typeof medalCounts]++;

    return {
      userId: user.id,
      name: user.name,
      areaId: user.area_id ?? null,
      areaName: user.area_id ? (areaMap.get(user.area_id) ?? null) : null,
      score,
      specialCount: medalCounts.SPECIAL,
      goldCount: medalCounts.GOLD,
      silverCount: medalCounts.SILVER,
      bronzeCount: medalCounts.BRONZE,
      totalCompliments: medals.length,
      totalTrainings: trainingsByUser.get(user.id) ?? 0,
    };
  });

  return sortCollaborators(scores);
}

export interface AreaScore {
  areaId: string;
  areaName: string;
  totalScore: number;
  collaboratorCount: number;
  totalCompliments: number;
  totalMedals: number;
  specialCount: number;
  goldCount: number;
}

export async function getAreaRanking(filter: RankingFilter = {}): Promise<AreaScore[]> {
  const collaborators = await getCollaboratorRanking(filter);

  const areaMap = new Map<string, AreaScore>();

  for (const c of collaborators) {
    if (!c.areaId || !c.areaName) continue;

    const existing = areaMap.get(c.areaId);
    if (existing) {
      existing.totalScore += c.score;
      existing.collaboratorCount++;
      existing.totalCompliments += c.totalCompliments;
      existing.totalMedals += c.specialCount + c.goldCount + c.silverCount + c.bronzeCount;
      existing.specialCount += c.specialCount;
      existing.goldCount += c.goldCount;
    } else {
      areaMap.set(c.areaId, {
        areaId: c.areaId,
        areaName: c.areaName,
        totalScore: c.score,
        collaboratorCount: 1,
        totalCompliments: c.totalCompliments,
        totalMedals: c.specialCount + c.goldCount + c.silverCount + c.bronzeCount,
        specialCount: c.specialCount,
        goldCount: c.goldCount,
      });
    }
  }

  return Array.from(areaMap.values()).sort((a, b) => b.totalScore - a.totalScore);
}

export async function getTeamRanking(managerId: string, filter: RankingFilter = {}): Promise<CollaboratorScore[]> {
  const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", managerId);
  const areaIds = (areas ?? []).map((a) => a.id);
  const collaborators = await getCollaboratorRanking({ ...filter });
  return collaborators.filter((c) => c.areaId && areaIds.includes(c.areaId));
}

export async function getUserScore(userId: string, filter: RankingFilter = {}) {
  const { year, quarter } = filter;

  let query = supabaseAdmin
    .from("compliments")
    .select("final_medal")
    .eq("status", "AVALIADO")
    .or(`collaborator_id.eq.${userId},submitted_by_id.eq.${userId}`);

  if (year) query = query.eq("year", year);
  if (quarter) query = query.eq("quarter", quarter);

  const { data: compliments } = await query;

  const medals = (compliments ?? []).filter((c) => c.final_medal).map((c) => ({ medal: c.final_medal as string }));
  const score = medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal as MedalType], 0);
  const medalCounts = { SPECIAL: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
  for (const { medal } of medals) medalCounts[medal as keyof typeof medalCounts]++;

  return { score, medals: medalCounts, totalCompliments: (compliments ?? []).length };
}

export async function getQuarterlyEvolution(userId: string, year: number) {
  const quarters = [1, 2, 3, 4];
  const data = await Promise.all(
    quarters.map(async (q) => {
      const { score, medals, totalCompliments } = await getUserScore(userId, { year, quarter: q });
      return { quarter: `T${q}`, score, medals, totalCompliments };
    })
  );
  return data;
}
