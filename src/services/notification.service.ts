import { supabaseAdmin } from "@/lib/supabase/admin";
import type { NotificationType } from "@/lib/supabase/types";
import { randomUUID } from "crypto";
import {
  sendEmail,
  buildComplimentApprovedEmail,
  buildComplimentRejectedEmail,
  buildComplimentReturnedEmail,
  buildComplimentEvaluatedEmail,
  buildNewPendingApprovalEmail,
  buildNewPendingEvaluationEmail,
} from "@/lib/email/email";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  const { data } = await supabaseAdmin.from("notifications").insert({
    id: randomUUID(),
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    reference_id: input.referenceId,
    reference_type: input.referenceType,
  }).select().single();
  return data;
}

export async function getNotifications(userId: string, onlyUnread = false) {
  let query = supabaseAdmin.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (onlyUnread) query = query.eq("is_read", false);
  const { data } = await query;
  return data ?? [];
}

export async function countUnread(userId: string): Promise<number> {
  const { count } = await supabaseAdmin.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false);
  return count ?? 0;
}

export async function markAsRead(id: string, userId: string) {
  const { data } = await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId).select().single();
  return data;
}

export async function markAllAsRead(userId: string) {
  await supabaseAdmin.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

export async function notifyComplimentApproved(compliment: { id: string; insured: string; collaboratorId: string }) {
  const { data: user } = await supabaseAdmin.from("users").select("name, email").eq("id", compliment.collaboratorId).single();
  if (!user) return;
  await createNotification({ userId: compliment.collaboratorId, type: "COMPLIMENT_APPROVED", title: "Elogio aprovado!", message: `Seu elogio de "${compliment.insured}" foi aprovado pelo gestor.`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: user.email, subject: "Seu elogio foi aprovado!", html: buildComplimentApprovedEmail(user.name, compliment.insured) }).catch(console.error);
}

export async function notifyComplimentRejected(compliment: { id: string; insured: string; collaboratorId: string; reason: string }) {
  const { data: user } = await supabaseAdmin.from("users").select("name, email").eq("id", compliment.collaboratorId).single();
  if (!user) return;
  await createNotification({ userId: compliment.collaboratorId, type: "COMPLIMENT_REJECTED", title: "Elogio não aprovado", message: `Seu elogio de "${compliment.insured}" não foi aprovado. Motivo: ${compliment.reason}`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: user.email, subject: "Elogio não aprovado", html: buildComplimentRejectedEmail(user.name, compliment.insured, compliment.reason) }).catch(console.error);
}

export async function notifyComplimentReturned(compliment: { id: string; insured: string; collaboratorId: string; observation: string }) {
  const { data: user } = await supabaseAdmin.from("users").select("name, email").eq("id", compliment.collaboratorId).single();
  if (!user) return;
  await createNotification({ userId: compliment.collaboratorId, type: "COMPLIMENT_RETURNED", title: "Elogio devolvido para ajuste", message: `Seu elogio de "${compliment.insured}" foi devolvido para ajuste.`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: user.email, subject: "Elogio devolvido para ajuste", html: buildComplimentReturnedEmail(user.name, compliment.insured, compliment.observation) }).catch(console.error);
}

export async function notifyComplimentEvaluated(compliment: { id: string; insured: string; collaboratorId: string; medal: string; justification: string }) {
  const { data: user } = await supabaseAdmin.from("users").select("name, email").eq("id", compliment.collaboratorId).single();
  if (!user) return;
  await createNotification({ userId: compliment.collaboratorId, type: "COMPLIMENT_EVALUATED", title: "Elogio avaliado com medalha!", message: `Seu elogio de "${compliment.insured}" recebeu uma medalha.`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: user.email, subject: "Seu elogio foi avaliado!", html: buildComplimentEvaluatedEmail(user.name, compliment.insured, compliment.medal, compliment.justification) }).catch(console.error);
}

export async function notifyManagerNewPending(compliment: { id: string; insured: string; collaboratorId: string; areaId: string | null }) {
  if (!compliment.areaId) return;
  const { data: area } = await supabaseAdmin.from("areas").select("*, manager:users!areas_manager_id_fkey(id, name, email)").eq("id", compliment.areaId).single();
  if (!area?.manager) return;
  const { data: collaborator } = await supabaseAdmin.from("users").select("name").eq("id", compliment.collaboratorId).single();
  await createNotification({ userId: (area.manager as any).id, type: "NEW_PENDING_APPROVAL", title: "Novo elogio aguardando aprovação", message: `${collaborator?.name ?? "Colaborador"} registrou um elogio de "${compliment.insured}" aguardando sua aprovação.`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: (area.manager as any).email, subject: "Novo elogio aguardando aprovação", html: buildNewPendingApprovalEmail((area.manager as any).name, collaborator?.name ?? "Colaborador", compliment.insured) }).catch(console.error);
}

export async function notifyDirectorNewPending(compliment: { id: string; insured: string; collaboratorId: string; areaId: string | null }) {
  if (!compliment.areaId) return;
  const { data: area } = await supabaseAdmin.from("areas").select("*, director:users!areas_director_id_fkey(id, name, email)").eq("id", compliment.areaId).single();
  if (!area?.director) return;
  const { data: collaborator } = await supabaseAdmin.from("users").select("name").eq("id", compliment.collaboratorId).single();
  await createNotification({ userId: (area.director as any).id, type: "NEW_PENDING_EVALUATION", title: "Novo elogio aguardando avaliação", message: `Elogio de ${collaborator?.name ?? "Colaborador"} aprovado e aguardando sua avaliação.`, referenceId: compliment.id, referenceType: "Compliment" });
  sendEmail({ to: (area.director as any).email, subject: "Novo elogio aguardando avaliação", html: buildNewPendingEvaluationEmail((area.director as any).name, collaborator?.name ?? "Colaborador", compliment.insured) }).catch(console.error);
}
