import { prisma } from "@/lib/db/prisma";
import { getUserScore, getCollaboratorRanking, getAreaRanking } from "./ranking.service";

export async function getCollaboratorDashboard(userId: string, year: number, quarter?: number) {
  const filter = { year, ...(quarter && { quarter }) };

  const [scoreData, compliments, trainings, rank] = await Promise.all([
    getUserScore(userId, filter),
    prisma.compliment.groupBy({
      by: ["status"],
      where: { collaboratorId: userId, year },
      _count: true,
    }),
    prisma.training.groupBy({
      by: ["type"],
      where: { collaboratorId: userId, year },
      _count: true,
    }),
    getCollaboratorRanking(filter).then((ranking) => {
      const pos = ranking.findIndex((r) => r.userId === userId);
      return pos >= 0 ? { position: pos + 1, total: ranking.length } : null;
    }),
  ]);

  const complimentStats = {
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    evaluated: 0,
  };
  for (const g of compliments) {
    complimentStats.total += g._count;
    if (g.status === "AVALIADO") complimentStats.evaluated += g._count;
    else if (g.status === "REJEITADO") complimentStats.rejected += g._count;
    else if (["PENDENTE_APROVACAO", "PENDENTE_AVALIACAO"].includes(g.status)) complimentStats.pending += g._count;
  }

  const trainingStats = { TRAINING: 0, CONSULTANCY: 0, COURSE: 0 };
  for (const t of trainings) {
    trainingStats[t.type as keyof typeof trainingStats] = t._count;
  }

  return {
    score: scoreData.score,
    medals: scoreData.medals,
    compliments: complimentStats,
    trainings: trainingStats,
    ranking: rank,
  };
}

export async function getManagerDashboard(managerId: string) {
  const areas = await prisma.area.findMany({ where: { managerId }, select: { id: true } });
  const areaIds = areas.map((a) => a.id);

  const [pending, total, byStatus] = await Promise.all([
    prisma.compliment.count({
      where: { status: "PENDENTE_APROVACAO", collaborator: { areaId: { in: areaIds } } },
    }),
    prisma.compliment.count({
      where: { collaborator: { areaId: { in: areaIds } } },
    }),
    prisma.compliment.groupBy({
      by: ["status"],
      where: { collaborator: { areaId: { in: areaIds } } },
      _count: true,
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const g of byStatus) statusMap[g.status] = g._count;

  return {
    pendingApproval: pending,
    totalCompliments: total,
    approved: (statusMap["PENDENTE_AVALIACAO"] ?? 0) + (statusMap["AVALIADO"] ?? 0),
    rejected: statusMap["REJEITADO"] ?? 0,
    evaluated: statusMap["AVALIADO"] ?? 0,
  };
}

export async function getDirectorDashboard(directorId: string) {
  const areas = await prisma.area.findMany({ where: { directorId }, select: { id: true } });
  const areaIds = areas.map((a) => a.id);

  const [pending, total, byStatus] = await Promise.all([
    prisma.compliment.count({
      where: { status: "PENDENTE_AVALIACAO", collaborator: { areaId: { in: areaIds } } },
    }),
    prisma.compliment.count({ where: { collaborator: { areaId: { in: areaIds } } } }),
    prisma.compliment.groupBy({
      by: ["status"],
      where: { collaborator: { areaId: { in: areaIds } } },
      _count: true,
    }),
  ]);

  const statusMap: Record<string, number> = {};
  for (const g of byStatus) statusMap[g.status] = g._count;

  return {
    pendingEvaluation: pending,
    totalCompliments: total,
    evaluated: statusMap["AVALIADO"] ?? 0,
    approved: statusMap["PENDENTE_AVALIACAO"] ?? 0,
  };
}

export async function getAdminDashboard() {
  const [users, areas, compliments, trainings, medals] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.area.count({ where: { isActive: true } }),
    prisma.compliment.count(),
    prisma.training.count(),
    prisma.complimentEvaluation.count(),
  ]);

  const byStatus = await prisma.compliment.groupBy({ by: ["status"], _count: true });
  const statusMap: Record<string, number> = {};
  for (const g of byStatus) statusMap[g.status] = g._count;

  const byRole = await prisma.user.groupBy({ by: ["role"], _count: true, where: { isActive: true } });
  const roleMap: Record<string, number> = {};
  for (const g of byRole) roleMap[g.role] = g._count;

  const [topCollaborators, topAreas] = await Promise.all([
    getCollaboratorRanking().then((r) => r.slice(0, 5)),
    getAreaRanking().then((r) => r.slice(0, 5)),
  ]);

  return {
    users: { total: users, byRole: roleMap },
    areas,
    compliments: { total: compliments, byStatus: statusMap },
    trainings,
    medals,
    topCollaborators,
    topAreas,
  };
}
