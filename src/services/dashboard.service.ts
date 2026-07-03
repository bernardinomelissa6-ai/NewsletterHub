import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserScore, getCollaboratorRanking, getAreaRanking } from "./ranking.service";

export async function getCollaboratorDashboard(userId: string, year: number, quarter?: number) {
  const filter = { year, ...(quarter && { quarter }) };

  const [scoreData, complimentsData, trainingsData, rankingData] = await Promise.all([
    getUserScore(userId, filter),
    supabaseAdmin.from("compliments").select("status").or(`collaborator_id.eq.${userId},submitted_by_id.eq.${userId}`).eq("year", year),
    supabaseAdmin.from("trainings").select("type").eq("collaborator_id", userId).eq("year", year),
    getCollaboratorRanking(filter),
  ]);

  const complimentStats = { total: 0, approved: 0, rejected: 0, pending: 0, evaluated: 0 };
  for (const c of complimentsData.data ?? []) {
    complimentStats.total++;
    if (c.status === "AVALIADO") complimentStats.evaluated++;
    else if (c.status === "REJEITADO") complimentStats.rejected++;
    else if (["PENDENTE_APROVACAO", "PENDENTE_AVALIACAO"].includes(c.status)) complimentStats.pending++;
  }

  const trainingStats = { TRAINING: 0, CONSULTANCY: 0, COURSE: 0 };
  for (const t of trainingsData.data ?? []) {
    trainingStats[t.type as keyof typeof trainingStats]++;
  }

  const pos = rankingData.findIndex((r) => r.userId === userId);
  const rank = pos >= 0 ? { position: pos + 1, total: rankingData.length } : null;

  return { score: scoreData.score, medals: scoreData.medals, compliments: complimentStats, trainings: trainingStats, ranking: rank };
}

export async function getManagerDashboard(managerId: string) {
  const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", managerId);
  const areaIds = (areas ?? []).map((a: any) => a.id);
  if (areaIds.length === 0) return { pendingApproval: 0, totalCompliments: 0, approved: 0, rejected: 0, evaluated: 0 };

  const { data: colls } = await supabaseAdmin.from("users").select("id").in("area_id", areaIds);
  const collaboratorIds = (colls ?? []).map((u: any) => u.id);
  if (collaboratorIds.length === 0) return { pendingApproval: 0, totalCompliments: 0, approved: 0, rejected: 0, evaluated: 0 };

  const { data: compliments } = await supabaseAdmin.from("compliments").select("status").in("collaborator_id", collaboratorIds);
  const all = compliments ?? [];
  const statusMap: Record<string, number> = {};
  for (const c of all) statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;

  return {
    pendingApproval: statusMap["PENDENTE_APROVACAO"] ?? 0,
    totalCompliments: all.length,
    approved: (statusMap["PENDENTE_AVALIACAO"] ?? 0) + (statusMap["AVALIADO"] ?? 0),
    rejected: statusMap["REJEITADO"] ?? 0,
    evaluated: statusMap["AVALIADO"] ?? 0,
  };
}

export async function getDirectorDashboard(directorId: string) {
  // Busca todos os elogios do sistema (um diretor pode avaliar qualquer elogio pendente)
  const [complimentsRes, myEvalsRes] = await Promise.all([
    supabaseAdmin.from("compliments").select("id, status"),
    supabaseAdmin.from("compliment_evaluations").select("compliment_id").eq("director_id", directorId),
  ]);

  const all = complimentsRes.data ?? [];
  const myEvaluatedIds = new Set((myEvalsRes.data ?? []).map((e: any) => e.compliment_id));

  const statusMap: Record<string, number> = {};
  for (const c of all) statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;

  // Pendentes de avaliação que este diretor ainda não avaliou
  const pendingAll = all.filter((c) => c.status === "PENDENTE_AVALIACAO");
  const pendingEvaluation = pendingAll.filter((c) => !myEvaluatedIds.has(c.id)).length;

  return {
    pendingEvaluation,
    totalCompliments: all.length,
    evaluated: statusMap["AVALIADO"] ?? 0,
    approved: (statusMap["PENDENTE_AVALIACAO"] ?? 0) + (statusMap["AVALIADO"] ?? 0),
  };
}

export async function getAdminDashboard() {
  const [usersRes, areasRes, complaintsRes, trainingsRes, medalsRes, byRoleRes, topColls, topAreas] = await Promise.all([
    supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("areas").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabaseAdmin.from("compliments").select("status"),
    supabaseAdmin.from("trainings").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("compliment_evaluations").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("users").select("role").eq("is_active", true),
    getCollaboratorRanking().then((r) => r.slice(0, 5)),
    getAreaRanking().then((r) => r.slice(0, 5)),
  ]);

  const statusMap: Record<string, number> = {};
  for (const c of complaintsRes.data ?? []) statusMap[c.status] = (statusMap[c.status] ?? 0) + 1;

  const roleMap: Record<string, number> = {};
  for (const u of byRoleRes.data ?? []) roleMap[u.role] = (roleMap[u.role] ?? 0) + 1;

  return {
    users: { total: usersRes.count ?? 0, byRole: roleMap },
    areas: areasRes.count ?? 0,
    compliments: { total: (complaintsRes.data ?? []).length, byStatus: statusMap },
    trainings: trainingsRes.count ?? 0,
    medals: medalsRes.count ?? 0,
    topCollaborators: topColls,
    topAreas,
  };
}
