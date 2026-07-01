import { supabaseAdmin } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit.service";
import { getQuarter } from "@/lib/utils/quarters";
import { randomUUID } from "crypto";
import type { CreateTrainingInput, TrainingFilterInput } from "@/lib/validations/training.schema";

export async function createTraining(
  input: CreateTrainingInput,
  submittedById: string,
  submittedByName: string,
  submittedByRole: string,
  attachmentUrl?: string,
  attachmentName?: string,
  attachmentType?: string,
  ipAddress?: string
) {
  const date = new Date(input.date);
  const year = date.getFullYear();
  const quarter = getQuarter(date);

  const { data: training, error } = await supabaseAdmin.from("trainings").insert({
    id: randomUUID(),
    insured: input.insured,
    date: date.toISOString(),
    type: input.type,
    branch: input.branch,
    collaborator_id: input.collaboratorId,
    submitted_by_id: submittedById,
    attachment_url: attachmentUrl ?? null,
    attachment_name: attachmentName ?? null,
    attachment_type: attachmentType ?? null,
    year,
    quarter,
    updated_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;

  await createAuditLog({ userId: submittedById, userName: submittedByName, userRole: submittedByRole, action: "CREATE", entityType: "Training", entityId: training.id, newValue: { type: input.type, branch: input.branch, collaboratorId: input.collaboratorId }, ipAddress });

  return training;
}

export async function getTrainingById(id: string) {
  const { data } = await supabaseAdmin
    .from("trainings")
    .select("*, collaborator:users!trainings_collaborator_id_fkey(*, area:areas(id, name)), submitted_by:users!trainings_submitted_by_id_fkey(id, name)")
    .eq("id", id)
    .single();
  return data;
}

export async function getTrainings(filter: TrainingFilterInput, userId: string, userRole: string) {
  const { page, limit, type, collaboratorId, areaId, year, quarter, search } = filter;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("trainings")
    .select("id, insured, date, type, branch, quarter, year, attachment_url, collaborator_id, collaborator:users!collaborator_id(id, name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userRole === "COLLABORATOR") {
    query = query.eq("collaborator_id", userId);
  } else if (userRole === "MANAGER") {
    const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", userId);
    const areaIds = (areas ?? []).map((a: any) => a.id);
    if (areaIds.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };
    query = query.in("collaborator_id", await getCollaboratorIds(areaIds));
  }

  if (type) query = query.eq("type", type);
  if (collaboratorId && userRole !== "COLLABORATOR") query = query.eq("collaborator_id", collaboratorId);
  if (areaId && userRole !== "COLLABORATOR" && userRole !== "MANAGER") {
    const ids = await getCollaboratorIds([areaId]);
    query = query.in("collaborator_id", ids);
  }
  if (year) query = query.eq("year", year);
  if (quarter) query = query.eq("quarter", quarter);
  if (search) query = query.ilike("insured", `%${search}%`);

  const { data, count, error } = await query;
  if (error) {
    console.error("getTrainings error:", JSON.stringify(error));
    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  const total = count ?? 0;
  return { data: data ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
}

async function getCollaboratorIds(areaIds: string[]): Promise<string[]> {
  const { data } = await supabaseAdmin.from("users").select("id").in("area_id", areaIds);
  return (data ?? []).map((u: any) => u.id);
}

export async function deleteTraining(id: string, userId: string, userName: string, userRole: string) {
  const { data: training } = await supabaseAdmin.from("trainings").select("*").eq("id", id).single();
  if (!training) throw new Error("Treinamento não encontrado");
  if (userRole !== "ADMIN" && training.submitted_by_id !== userId) throw new Error("Sem permissão");

  await supabaseAdmin.from("trainings").delete().eq("id", id);

  await createAuditLog({ userId, userName, userRole, action: "DELETE", entityType: "Training", entityId: id, previousValue: { type: training.type, branch: training.branch } });
}
