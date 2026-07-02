import { supabaseAdmin } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit.service";
import {
  notifyComplimentApproved,
  notifyComplimentRejected,
  notifyComplimentReturned,
  notifyComplimentEvaluated,
  notifyManagerNewPending,
  notifyDirectorNewPending,
} from "./notification.service";
import { getQuarter } from "@/lib/utils/quarters";
import { calculateFinalMedal } from "@/lib/utils/medal-calculation";
import { randomUUID } from "crypto";
import type { MedalType } from "@/lib/supabase/types";
import type {
  CreateComplimentInput,
  ApproveComplimentInput,
  RejectComplimentInput,
  ReturnComplimentInput,
  EvaluateComplimentInput,
  ReevaluateComplimentInput,
  ComplimentFilterInput,
} from "@/lib/validations/compliment.schema";

const COMPLIMENT_LIST_SELECT = `
  id, insured, received_at, branch, reason, status,
  attachment_url, quarter, year, created_at,
  collaborator:users!collaborator_id(id, name),
  evaluations:compliment_evaluations(medal)
`;

const COMPLIMENT_SELECT = `
  id, insured, received_at, branch, reason, status,
  attachment_url, attachment_name, attachment_type,
  quarter, year, created_at, updated_at,
  collaborator:users!collaborator_id(
    id, name, email, area_id,
    area:areas(id, name)
  ),
  submitted_by:users!submitted_by_id(id, name),
  approvals:compliment_approvals(
    id, action, observation, created_at,
    manager:users!manager_id(id, name)
  ),
  evaluations:compliment_evaluations(
    id, director_id, medal, justification, comment,
    director:users!director_id(id, name, role)
  )
`;

export async function createCompliment(
  input: CreateComplimentInput,
  submittedById: string,
  submittedByName: string,
  submittedByRole: string,
  attachmentUrl?: string,
  attachmentName?: string,
  attachmentType?: string,
  ipAddress?: string
) {
  const receivedAt = new Date(input.receivedAt);
  const year = receivedAt.getFullYear();
  const quarter = getQuarter(receivedAt);

  const { data: compliment, error } = await supabaseAdmin.from("compliments").insert({
    id: randomUUID(),
    insured: input.insured,
    received_at: receivedAt.toISOString(),
    branch: input.branch,
    reason: input.reason,
    collaborator_id: input.collaboratorId,
    submitted_by_id: submittedById,
    attachment_url: attachmentUrl ?? null,
    attachment_name: attachmentName ?? null,
    attachment_type: attachmentType ?? null,
    year,
    quarter,
    status: "PENDENTE_APROVACAO",
    updated_at: new Date().toISOString(),
  }).select("id, insured, collaborator_id, collaborator:users!compliments_collaborator_id_fkey(area_id)").single();

  if (error) throw error;

  await createAuditLog({ userId: submittedById, userName: submittedByName, userRole: submittedByRole, action: "CREATE", entityType: "Compliment", entityId: compliment.id, newValue: { insured: input.insured, collaboratorId: input.collaboratorId, status: "PENDENTE_APROVACAO" }, ipAddress });

  const areaId = (compliment.collaborator as any)?.area_id ?? null;
  notifyManagerNewPending({ id: compliment.id, insured: compliment.insured, collaboratorId: compliment.collaborator_id, areaId }).catch(console.error);

  return compliment;
}

export async function getComplimentById(id: string) {
  const { data } = await supabaseAdmin.from("compliments").select(COMPLIMENT_SELECT).eq("id", id).single();
  return data;
}

export async function getCompliments(filter: ComplimentFilterInput, userId: string, userRole: string, _userAreaId: string | null) {
  const { page, limit, status, collaboratorId, areaId, branch, year, quarter, search } = filter;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let collaboratorFilter: string[] | null = null;

  if (userRole === "COLLABORATOR") {
    collaboratorFilter = [userId];
  } else if (userRole === "MANAGER") {
    const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", userId);
    const areaIds = (areas ?? []).map((a: any) => a.id);
    const { data: colls } = await supabaseAdmin.from("users").select("id").in("area_id", areaIds);
    collaboratorFilter = (colls ?? []).map((u: any) => u.id);
    if (collaboratorFilter.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };
  } else if (userRole === "DIRECTOR" && areaId) {
    const { data: colls } = await supabaseAdmin.from("users").select("id").eq("area_id", areaId);
    collaboratorFilter = (colls ?? []).map((u: any) => u.id);
  }

  let query = supabaseAdmin
    .from("compliments")
    .select(COMPLIMENT_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (collaboratorFilter) query = query.in("collaborator_id", collaboratorFilter);
  if (status) query = query.eq("status", status);
  if (collaboratorId && userRole !== "COLLABORATOR") query = query.eq("collaborator_id", collaboratorId);
  if (branch) query = query.ilike("branch", `%${branch}%`);
  if (year) query = query.eq("year", year);
  if (quarter) query = query.eq("quarter", quarter);
  if (search) query = query.or(`insured.ilike.%${search}%,reason.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) {
    console.error("getCompliments error:", JSON.stringify(error));
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  const total = count ?? 0;
  return { data: data ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPendingApprovals(managerId: string) {
  const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", managerId);
  const areaIds = (areas ?? []).map((a: any) => a.id);
  const { data: colls } = await supabaseAdmin.from("users").select("id").in("area_id", areaIds);
  const collaboratorIds = (colls ?? []).map((u: any) => u.id);
  if (collaboratorIds.length === 0) return [];

  const { data } = await supabaseAdmin.from("compliments").select(COMPLIMENT_SELECT).eq("status", "PENDENTE_APROVACAO").in("collaborator_id", collaboratorIds).order("created_at");
  return data ?? [];
}

export async function getPendingEvaluations(directorId: string) {
  const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("director_id", directorId);
  const areaIds = (areas ?? []).map((a: any) => a.id);
  const { data: colls } = await supabaseAdmin.from("users").select("id").in("area_id", areaIds);
  const collaboratorIds = (colls ?? []).map((u: any) => u.id);
  if (collaboratorIds.length === 0) return [];

  const { data } = await supabaseAdmin.from("compliments").select(COMPLIMENT_SELECT).eq("status", "PENDENTE_AVALIACAO").in("collaborator_id", collaboratorIds).order("created_at");
  return data ?? [];
}

export async function approveCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: ApproveComplimentInput,
  ipAddress?: string
) {
  const { data: previous } = await supabaseAdmin.from("compliments").select("status, insured, collaborator_id").eq("id", id).single();
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  await supabaseAdmin.from("compliments").update({ status: "PENDENTE_AVALIACAO", updated_at: new Date().toISOString() }).eq("id", id);
  await supabaseAdmin.from("compliment_approvals").insert({ id: randomUUID(), compliment_id: id, manager_id: managerId, action: "APPROVED", observation: input.observation });

  await createAuditLog({ userId: managerId, userName: managerName, userRole: managerRole, action: "APPROVE", entityType: "Compliment", entityId: id, previousValue: { status: previous.status }, newValue: { status: "PENDENTE_AVALIACAO" }, ipAddress });

  const { data: collaborator } = await supabaseAdmin.from("users").select("area_id").eq("id", previous.collaborator_id).single();
  notifyComplimentApproved({ id, insured: previous.insured, collaboratorId: previous.collaborator_id }).catch(console.error);
  notifyDirectorNewPending({ id, insured: previous.insured, collaboratorId: previous.collaborator_id, areaId: collaborator?.area_id ?? null }).catch(console.error);
}

export async function rejectCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: RejectComplimentInput,
  ipAddress?: string
) {
  const { data: previous } = await supabaseAdmin.from("compliments").select("status, insured, collaborator_id").eq("id", id).single();
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  await supabaseAdmin.from("compliments").update({ status: "REJEITADO", updated_at: new Date().toISOString() }).eq("id", id);
  await supabaseAdmin.from("compliment_approvals").insert({ id: randomUUID(), compliment_id: id, manager_id: managerId, action: "REJECTED", observation: input.observation });

  await createAuditLog({ userId: managerId, userName: managerName, userRole: managerRole, action: "REJECT", entityType: "Compliment", entityId: id, previousValue: { status: previous.status }, newValue: { status: "REJEITADO", reason: input.observation }, ipAddress });

  notifyComplimentRejected({ id, insured: previous.insured, collaboratorId: previous.collaborator_id, reason: input.observation }).catch(console.error);
}

export async function returnCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: ReturnComplimentInput,
  ipAddress?: string
) {
  const { data: previous } = await supabaseAdmin.from("compliments").select("status, insured, collaborator_id").eq("id", id).single();
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  await supabaseAdmin.from("compliments").update({ status: "DEVOLVIDO_PARA_AJUSTE", updated_at: new Date().toISOString() }).eq("id", id);
  await supabaseAdmin.from("compliment_approvals").insert({ id: randomUUID(), compliment_id: id, manager_id: managerId, action: "RETURNED", observation: input.observation });

  await createAuditLog({ userId: managerId, userName: managerName, userRole: managerRole, action: "RETURN_FOR_ADJUSTMENT", entityType: "Compliment", entityId: id, previousValue: { status: previous.status }, newValue: { status: "DEVOLVIDO_PARA_AJUSTE" }, ipAddress });

  notifyComplimentReturned({ id, insured: previous.insured, collaboratorId: previous.collaborator_id, observation: input.observation }).catch(console.error);
}

const CENTRAL_ROLES = ["DIRETOR_CENTRAL", "ADMIN"] as const;
const isCentral = (role: string) => (CENTRAL_ROLES as readonly string[]).includes(role);

export async function getPendingEvaluationsForCentralDirector(centralDirectorId: string) {
  const { data } = await supabaseAdmin
    .from("compliments")
    .select(`
      id, insured, received_at, branch, reason, status, quarter, year, created_at, attachment_url, collaborator_id,
      evaluations:compliment_evaluations(director_id, medal, justification, director:users!director_id(id, name, role)),
      collaborator:users!collaborator_id(id, name, area:areas(name)),
      approvals:compliment_approvals(action, observation, manager:users!manager_id(name))
    `)
    .eq("status", "PENDENTE_AVALIACAO")
    .order("created_at");

  return (data ?? []).filter((c: any) => {
    const evals = c.evaluations ?? [];
    const regularCount = evals.filter((e: any) => e.director?.role === "DIRECTOR").length;
    const alreadyCentral = evals.some((e: any) => isCentral(e.director?.role ?? ""));
    return regularCount >= 2 && !alreadyCentral;
  });
}

export async function evaluateCompliment(
  id: string,
  directorId: string,
  directorName: string,
  directorRole: string,
  input: EvaluateComplimentInput,
  ipAddress?: string
) {
  const { data: previous } = await supabaseAdmin.from("compliments").select("status, insured, collaborator_id").eq("id", id).single();
  if (!previous || previous.status !== "PENDENTE_AVALIACAO") throw new Error("Elogio não está pendente de avaliação");

  const { data: existingEvals } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("director_id, director:users!director_id(role)")
    .eq("compliment_id", id);

  const evals = existingEvals ?? [];
  const regularEvals = evals.filter((e: any) => !isCentral(e.director?.role ?? ""));
  const centralEvals = evals.filter((e: any) => isCentral(e.director?.role ?? ""));
  const myEval = evals.find((e: any) => e.director_id === directorId);

  if (myEval) throw new Error("Você já avaliou este elogio");

  if (isCentral(directorRole)) {
    if (regularEvals.length < 2) throw new Error("Aguardando avaliação dos 2 Diretores antes do Diretor Central");
    if (centralEvals.length > 0) throw new Error("O Diretor Central já avaliou este elogio");
  } else {
    if (regularEvals.length >= 2) throw new Error("Este elogio já possui as 2 avaliações de Diretor necessárias");
  }

  await supabaseAdmin.from("compliment_evaluations").insert({
    id: randomUUID(),
    compliment_id: id,
    director_id: directorId,
    medal: input.medal,
    justification: input.justification,
    comment: input.comment ?? null,
    updated_at: new Date().toISOString(),
  });

  if (isCentral(directorRole)) {
    const allEvals = [
      ...regularEvals.map((e: any) => ({ medal: e.medal as MedalType, isCentralDirector: false })),
      { medal: input.medal as MedalType, isCentralDirector: true },
    ];
    const { score, finalMedal } = calculateFinalMedal(allEvals);

    await supabaseAdmin.from("compliments").update({
      status: "AVALIADO",
      final_medal: finalMedal,
      evaluation_score: score,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    await createAuditLog({ userId: directorId, userName: directorName, userRole: directorRole, action: "EVALUATE", entityType: "Compliment", entityId: id, previousValue: { status: previous.status }, newValue: { status: "AVALIADO", final_medal: finalMedal, evaluation_score: score }, ipAddress });
    notifyComplimentEvaluated({ id, insured: previous.insured, collaboratorId: previous.collaborator_id, medal: finalMedal, justification: input.justification }).catch(console.error);
  } else {
    await createAuditLog({ userId: directorId, userName: directorName, userRole: directorRole, action: "EVALUATE", entityType: "Compliment", entityId: id, previousValue: { status: previous.status }, newValue: { medal: input.medal, regularEvaluationsCount: regularEvals.length + 1 }, ipAddress });
  }
}

export async function reevaluateCompliment(
  id: string,
  directorId: string,
  directorName: string,
  directorRole: string,
  input: ReevaluateComplimentInput,
  ipAddress?: string
) {
  const { data: evaluation } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("id, medal")
    .eq("compliment_id", id)
    .eq("director_id", directorId)
    .maybeSingle();
  if (!evaluation) throw new Error("Você não avaliou este elogio ainda");

  await supabaseAdmin.from("compliment_evaluations").update({ medal: input.medal, updated_at: new Date().toISOString() }).eq("id", evaluation.id);
  await supabaseAdmin.from("compliment_reevaluations").insert({ id: randomUUID(), compliment_id: id, director_id: directorId, previous_medal: evaluation.medal, new_medal: input.medal, reason: input.reason });

  const { data: allEvals } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("medal, director_id, director:users!director_id(role)")
    .eq("compliment_id", id);

  const evalList = (allEvals ?? []).map((e: any) => ({
    medal: e.medal as MedalType,
    isCentralDirector: isCentral(e.director?.role ?? ""),
  }));

  const centralEval = evalList.find((e) => e.isCentralDirector);
  const regularEvals = evalList.filter((e) => !e.isCentralDirector);

  if (centralEval && regularEvals.length >= 2) {
    const { score, finalMedal } = calculateFinalMedal(evalList);
    await supabaseAdmin.from("compliments").update({ final_medal: finalMedal, evaluation_score: score, updated_at: new Date().toISOString() }).eq("id", id);
    const { data: compliment } = await supabaseAdmin.from("compliments").select("insured, collaborator_id").eq("id", id).single();
    await createAuditLog({ userId: directorId, userName: directorName, userRole: directorRole, action: "REEVALUATE", entityType: "Compliment", entityId: id, previousValue: { medal: evaluation.medal }, newValue: { medal: input.medal, final_medal: finalMedal, reason: input.reason }, ipAddress });
    if (compliment) {
      notifyComplimentEvaluated({ id, insured: compliment.insured, collaboratorId: compliment.collaborator_id, medal: finalMedal, justification: input.reason }).catch(console.error);
    }
  } else {
    await createAuditLog({ userId: directorId, userName: directorName, userRole: directorRole, action: "REEVALUATE", entityType: "Compliment", entityId: id, previousValue: { medal: evaluation.medal }, newValue: { medal: input.medal, reason: input.reason }, ipAddress });
  }
}

export async function updateCompliment(
  id: string,
  userId: string,
  userName: string,
  userRole: string,
  data: Partial<CreateComplimentInput> & { attachmentUrl?: string; attachmentName?: string; attachmentType?: string },
  ipAddress?: string
) {
  const { data: previous } = await supabaseAdmin.from("compliments").select("*").eq("id", id).single();
  if (!previous) throw new Error("Elogio não encontrado");

  if (userRole === "COLLABORATOR" && previous.submitted_by_id !== userId) throw new Error("Sem permissão para editar este elogio");
  if (!["PENDENTE_APROVACAO", "DEVOLVIDO_PARA_AJUSTE"].includes(previous.status) && userRole !== "ADMIN") throw new Error("Este elogio não pode ser editado no status atual");

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.insured) updateData.insured = data.insured;
  if (data.receivedAt) {
    const d = new Date(data.receivedAt);
    updateData.received_at = d.toISOString();
    updateData.year = d.getFullYear();
    updateData.quarter = getQuarter(d);
  }
  if (data.branch) updateData.branch = data.branch;
  if (data.reason) updateData.reason = data.reason;
  if (data.collaboratorId) updateData.collaborator_id = data.collaboratorId;
  if (data.attachmentUrl !== undefined) updateData.attachment_url = data.attachmentUrl;
  if (data.attachmentName !== undefined) updateData.attachment_name = data.attachmentName;
  if (data.attachmentType !== undefined) updateData.attachment_type = data.attachmentType;

  if (previous.status === "DEVOLVIDO_PARA_AJUSTE") updateData.status = "PENDENTE_APROVACAO";

  const { data: updated, error } = await supabaseAdmin.from("compliments").update(updateData).eq("id", id).select().single();
  if (error) throw error;

  await createAuditLog({ userId, userName, userRole, action: "UPDATE", entityType: "Compliment", entityId: id, previousValue: { status: previous.status, insured: previous.insured }, newValue: updateData, ipAddress });

  if (previous.status === "DEVOLVIDO_PARA_AJUSTE") {
    const { data: collaborator } = await supabaseAdmin.from("users").select("area_id").eq("id", updated.collaborator_id).single();
    notifyManagerNewPending({ id, insured: updated.insured, collaboratorId: updated.collaborator_id, areaId: collaborator?.area_id ?? null }).catch(console.error);
  }

  return updated;
}
