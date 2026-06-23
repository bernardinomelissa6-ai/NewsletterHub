import { prisma } from "@/lib/db/prisma";
import { MEDAL_POINTS, sortCollaborators, type CollaboratorScore } from "@/lib/utils/ranking";
import type { MedalType } from "@prisma/client";

export interface RankingFilter {
  year?: number;
  quarter?: number;
  areaId?: string;
}

export async function getCollaboratorRanking(filter: RankingFilter = {}): Promise<CollaboratorScore[]> {
  const { year, quarter, areaId } = filter;

  const complimentWhere: Record<string, unknown> = { status: "AVALIADO" };
  if (year) complimentWhere.year = year;
  if (quarter) complimentWhere.quarter = quarter;

  const trainingWhere: Record<string, unknown> = {};
  if (year) trainingWhere.year = year;
  if (quarter) trainingWhere.quarter = quarter;

  const userWhere: Record<string, unknown> = { role: "COLLABORATOR", isActive: true };
  if (areaId) userWhere.areaId = areaId;

  const users = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      areaId: true,
      area: { select: { name: true } },
      receivedCompliments: {
        where: complimentWhere,
        select: {
          id: true,
          evaluations: { select: { medal: true } },
        },
      },
      receivedTrainings: {
        where: trainingWhere,
        select: { id: true },
      },
    },
  });

  const scores: CollaboratorScore[] = users.map((user) => {
    const medals = user.receivedCompliments.flatMap((c) => c.evaluations);
    const score = medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal as MedalType], 0);

    const medalCounts = { SPECIAL: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
    for (const { medal } of medals) {
      medalCounts[medal as keyof typeof medalCounts]++;
    }

    return {
      userId: user.id,
      name: user.name,
      areaId: user.areaId,
      areaName: user.area?.name ?? null,
      score,
      specialCount: medalCounts.SPECIAL,
      goldCount: medalCounts.GOLD,
      silverCount: medalCounts.SILVER,
      bronzeCount: medalCounts.BRONZE,
      totalCompliments: user.receivedCompliments.length,
      totalTrainings: user.receivedTrainings.length,
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
  const areas = await prisma.area.findMany({ where: { managerId }, select: { id: true } });
  const areaIds = areas.map((a) => a.id);
  const collaborators = await getCollaboratorRanking({ ...filter });
  return collaborators.filter((c) => c.areaId && areaIds.includes(c.areaId));
}

export async function getUserScore(userId: string, filter: RankingFilter = {}) {
  const { year, quarter } = filter;
  const where: Record<string, unknown> = { status: "AVALIADO", collaboratorId: userId };
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;

  const compliments = await prisma.compliment.findMany({
    where,
    select: { evaluations: { select: { medal: true } } },
  });

  const medals = compliments.flatMap((c) => c.evaluations);
  const score = medals.reduce((acc, { medal }) => acc + MEDAL_POINTS[medal as MedalType], 0);

  const medalCounts = { SPECIAL: 0, GOLD: 0, SILVER: 0, BRONZE: 0 };
  for (const { medal } of medals) {
    medalCounts[medal as keyof typeof medalCounts]++;
  }

  return { score, medals: medalCounts, totalCompliments: compliments.length };
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
