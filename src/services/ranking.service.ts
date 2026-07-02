import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDAL_POINTS, sortCollaborators, type CollaboratorScore } from "@/lib/utils/ranking";
import type { MedalType } from "@/lib/supabase/types";

export interface RankingFilter {
  year?: number;
  quarter?: number;
  areaId?: string;
}

export async function getCollaboratorRanking(filter: RankingFilter = {}): Promise<CollaboratorScore[]> {
  const { year, quarter, areaId } = filter;

  let usersQuery = supabaseAdmin
    .from("users")
    .select("id, name, area_id, area:areas(name)")
    .eq("role", "COLLABORATOR")
    .eq("is_active", true);

  if (areaId) usersQuery = usersQuery.eq("area_id", areaId);

  const { data: users } = await usersQuery;
  if (!users || users.length === 0) return [];

  const userIds = users.map((u) => u.id);

  let complimentsQuery = supabaseAdmin
    .from("compliments")
    .select("collaborator_id, final_medal")
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
  const trainingsByUser = new Map<string, number>();

  for (const c of compliments ?? []) {
    if (!c.final_medal) continue;
    const evals = medalsByUser.get(c.collaborator_id) ?? [];
    evals.push({ medal: c.final_medal });
    medalsByUser.set(c.collaborator_id, evals);
  }
  for (const t of trainings ?? []) {
    trainingsByUser.set(t.collaborator_id, (trainingsByUser.get(t.collaborator_id) ?? 0) + 1);
  }

  const scores: CollaboratorScore[] = users.map((user) => {
    const medals = medalsByUser.get(user.id) ?? [];
    const score = medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal as MedalType], 0);
    const medalCounts = { SPECIAL: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
    for (const { medal } of medals) medalCounts[medal as keyof typeof medalCounts]++;

    return {
      userId: user.id,
      name: user.name,
      areaId: user.area_id,
      areaName: (user.area as any)?.name ?? null,
      score,
      specialCount: medalCounts.SPECIAL,
      goldCount: medalCounts.GOLD,
      silverCount: medalCounts.SILVER,
      bronzeCount: medalCounts.BRONZE,
      totalCompliments: (medalsByUser.get(user.id) ?? []).length,
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
