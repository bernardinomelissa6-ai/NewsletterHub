import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "@prisma/client";
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
  return prisma.notification.create({ data: input });
}

export async function getNotifications(userId: string, onlyUnread = false) {
  return prisma.notification.findMany({
    where: { userId, ...(onlyUnread && { isRead: false }) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function countUnread(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(id: string, userId: string) {
  return prisma.notification.update({ where: { id, userId }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

// ── Notificações de domínio ────────────────────────────────────────────────

export async function notifyComplimentApproved(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true, email: true },
  });
  if (!user) return;

  await createNotification({
    userId: compliment.collaboratorId,
    type: "COMPLIMENT_APPROVED",
    title: "Elogio aprovado!",
    message: `Seu elogio de "${compliment.insured}" foi aprovado pelo gestor e encaminhado para avaliação.`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: user.email,
    subject: "Seu elogio foi aprovado!",
    html: buildComplimentApprovedEmail(user.name, compliment.insured),
  }).catch(console.error);
}

export async function notifyComplimentRejected(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
  reason: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true, email: true },
  });
  if (!user) return;

  await createNotification({
    userId: compliment.collaboratorId,
    type: "COMPLIMENT_REJECTED",
    title: "Elogio não aprovado",
    message: `Seu elogio de "${compliment.insured}" não foi aprovado. Motivo: ${compliment.reason}`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: user.email,
    subject: "Elogio não aprovado",
    html: buildComplimentRejectedEmail(user.name, compliment.insured, compliment.reason),
  }).catch(console.error);
}

export async function notifyComplimentReturned(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
  observation: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true, email: true },
  });
  if (!user) return;

  await createNotification({
    userId: compliment.collaboratorId,
    type: "COMPLIMENT_RETURNED",
    title: "Elogio devolvido para ajuste",
    message: `Seu elogio de "${compliment.insured}" foi devolvido para ajuste.`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: user.email,
    subject: "Elogio devolvido para ajuste",
    html: buildComplimentReturnedEmail(user.name, compliment.insured, compliment.observation),
  }).catch(console.error);
}

export async function notifyComplimentEvaluated(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
  medal: string;
  justification: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true, email: true },
  });
  if (!user) return;

  await createNotification({
    userId: compliment.collaboratorId,
    type: "COMPLIMENT_EVALUATED",
    title: "Elogio avaliado com medalha!",
    message: `Seu elogio de "${compliment.insured}" recebeu uma medalha.`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: user.email,
    subject: "Seu elogio foi avaliado!",
    html: buildComplimentEvaluatedEmail(user.name, compliment.insured, compliment.medal, compliment.justification),
  }).catch(console.error);
}

export async function notifyManagerNewPending(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
  areaId: string | null;
}) {
  if (!compliment.areaId) return;

  const area = await prisma.area.findUnique({
    where: { id: compliment.areaId },
    include: { manager: { select: { id: true, name: true, email: true } } },
  });
  if (!area?.manager) return;

  const collaborator = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true },
  });

  await createNotification({
    userId: area.manager.id,
    type: "NEW_PENDING_APPROVAL",
    title: "Novo elogio aguardando aprovação",
    message: `${collaborator?.name ?? "Colaborador"} registrou um elogio de "${compliment.insured}" aguardando sua aprovação.`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: area.manager.email,
    subject: "Novo elogio aguardando aprovação",
    html: buildNewPendingApprovalEmail(area.manager.name, collaborator?.name ?? "Colaborador", compliment.insured),
  }).catch(console.error);
}

export async function notifyDirectorNewPending(compliment: {
  id: string;
  insured: string;
  collaboratorId: string;
  areaId: string | null;
}) {
  if (!compliment.areaId) return;

  const area = await prisma.area.findUnique({
    where: { id: compliment.areaId },
    include: { director: { select: { id: true, name: true, email: true } } },
  });
  if (!area?.director) return;

  const collaborator = await prisma.user.findUnique({
    where: { id: compliment.collaboratorId },
    select: { name: true },
  });

  await createNotification({
    userId: area.director.id,
    type: "NEW_PENDING_EVALUATION",
    title: "Novo elogio aguardando avaliação",
    message: `Elogio de ${collaborator?.name ?? "Colaborador"} aprovado e aguardando sua avaliação.`,
    referenceId: compliment.id,
    referenceType: "Compliment",
  });

  sendEmail({
    to: area.director.email,
    subject: "Novo elogio aguardando avaliação",
    html: buildNewPendingEvaluationEmail(area.director.name, collaborator?.name ?? "Colaborador", compliment.insured),
  }).catch(console.error);
}
