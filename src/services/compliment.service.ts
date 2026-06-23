import { prisma } from "@/lib/db/prisma";
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
import type {
  CreateComplimentInput,
  ApproveComplimentInput,
  RejectComplimentInput,
  ReturnComplimentInput,
  EvaluateComplimentInput,
  ReevaluateComplimentInput,
  ComplimentFilterInput,
} from "@/lib/validations/compliment.schema";

const COMPLIMENT_SELECT = {
  id: true,
  insured: true,
  receivedAt: true,
  branch: true,
  reason: true,
  status: true,
  attachmentUrl: true,
  attachmentName: true,
  attachmentType: true,
  quarter: true,
  year: true,
  createdAt: true,
  updatedAt: true,
  collaborator: { select: { id: true, name: true, email: true, areaId: true, area: { select: { id: true, name: true } } } },
  submittedBy: { select: { id: true, name: true } },
  approvals: {
    orderBy: { createdAt: "desc" as const },
    include: { manager: { select: { id: true, name: true } } },
  },
  evaluations: {
    include: { director: { select: { id: true, name: true } } },
  },
  reevaluations: {
    orderBy: { createdAt: "desc" as const },
    include: { director: { select: { id: true, name: true } } },
  },
};

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

  const compliment = await prisma.compliment.create({
    data: {
      insured: input.insured,
      receivedAt,
      branch: input.branch,
      reason: input.reason,
      collaboratorId: input.collaboratorId,
      submittedById,
      attachmentUrl,
      attachmentName,
      attachmentType,
      year,
      quarter,
    },
    include: { collaborator: { select: { areaId: true } } },
  });

  await createAuditLog({
    userId: submittedById,
    userName: submittedByName,
    userRole: submittedByRole,
    action: "CREATE",
    entityType: "Compliment",
    entityId: compliment.id,
    newValue: { insured: input.insured, collaboratorId: input.collaboratorId, status: "PENDENTE_APROVACAO" },
    ipAddress,
  });

  notifyManagerNewPending({
    id: compliment.id,
    insured: compliment.insured,
    collaboratorId: compliment.collaboratorId,
    areaId: compliment.collaborator.areaId,
  }).catch(console.error);

  return compliment;
}

export async function getComplimentById(id: string) {
  return prisma.compliment.findUnique({ where: { id }, select: COMPLIMENT_SELECT });
}

export async function getCompliments(filter: ComplimentFilterInput, userId: string, userRole: string, userAreaId: string | null) {
  const { page, limit, status, collaboratorId, areaId, branch, year, quarter, search } = filter;
  const skip = (page - 1) * limit;

  let where: Record<string, unknown> = {};

  if (userRole === "COLLABORATOR") {
    where.collaboratorId = userId;
  } else if (userRole === "MANAGER") {
    const managedAreas = await prisma.area.findMany({ where: { managerId: userId }, select: { id: true } });
    const areaIds = managedAreas.map((a) => a.id);
    where.collaborator = { areaId: { in: areaIds } };
  }

  if (status) where.status = status;
  if (collaboratorId && userRole !== "COLLABORATOR") where.collaboratorId = collaboratorId;
  if (areaId && userRole !== "COLLABORATOR" && userRole !== "MANAGER") {
    where.collaborator = { areaId };
  }
  if (branch) where.branch = { contains: branch, mode: "insensitive" };
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;
  if (search) {
    where.OR = [
      { insured: { contains: search, mode: "insensitive" } },
      { reason: { contains: search, mode: "insensitive" } },
      { collaborator: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.compliment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: COMPLIMENT_SELECT,
    }),
    prisma.compliment.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPendingApprovals(managerId: string) {
  const managedAreas = await prisma.area.findMany({ where: { managerId }, select: { id: true } });
  const areaIds = managedAreas.map((a) => a.id);

  return prisma.compliment.findMany({
    where: {
      status: "PENDENTE_APROVACAO",
      collaborator: { areaId: { in: areaIds } },
    },
    orderBy: { createdAt: "asc" },
    select: COMPLIMENT_SELECT,
  });
}

export async function getPendingEvaluations(directorId: string) {
  const directedAreas = await prisma.area.findMany({ where: { directorId }, select: { id: true } });
  const areaIds = directedAreas.map((a) => a.id);

  return prisma.compliment.findMany({
    where: {
      status: "PENDENTE_AVALIACAO",
      collaborator: { areaId: { in: areaIds } },
    },
    orderBy: { createdAt: "asc" },
    select: COMPLIMENT_SELECT,
  });
}

export async function approveCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: ApproveComplimentInput,
  ipAddress?: string
) {
  const previous = await prisma.compliment.findUnique({ where: { id }, select: { status: true, insured: true, collaboratorId: true } });
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  const [updated] = await Promise.all([
    prisma.compliment.update({ where: { id }, data: { status: "PENDENTE_AVALIACAO" } }),
    prisma.complimentApproval.create({
      data: { complimentId: id, managerId, action: "APPROVED", observation: input.observation },
    }),
  ]);

  await createAuditLog({
    userId: managerId,
    userName: managerName,
    userRole: managerRole,
    action: "APPROVE",
    entityType: "Compliment",
    entityId: id,
    previousValue: { status: previous.status },
    newValue: { status: "PENDENTE_AVALIACAO" },
    ipAddress,
  });

  const collaborator = await prisma.user.findUnique({ where: { id: previous.collaboratorId }, select: { areaId: true } });

  notifyComplimentApproved({ id, insured: previous.insured, collaboratorId: previous.collaboratorId }).catch(console.error);
  notifyDirectorNewPending({ id, insured: previous.insured, collaboratorId: previous.collaboratorId, areaId: collaborator?.areaId ?? null }).catch(console.error);

  return updated;
}

export async function rejectCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: RejectComplimentInput,
  ipAddress?: string
) {
  const previous = await prisma.compliment.findUnique({ where: { id }, select: { status: true, insured: true, collaboratorId: true } });
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  const [updated] = await Promise.all([
    prisma.compliment.update({ where: { id }, data: { status: "REJEITADO" } }),
    prisma.complimentApproval.create({
      data: { complimentId: id, managerId, action: "REJECTED", observation: input.observation },
    }),
  ]);

  await createAuditLog({
    userId: managerId,
    userName: managerName,
    userRole: managerRole,
    action: "REJECT",
    entityType: "Compliment",
    entityId: id,
    previousValue: { status: previous.status },
    newValue: { status: "REJEITADO", reason: input.observation },
    ipAddress,
  });

  notifyComplimentRejected({
    id,
    insured: previous.insured,
    collaboratorId: previous.collaboratorId,
    reason: input.observation,
  }).catch(console.error);

  return updated;
}

export async function returnCompliment(
  id: string,
  managerId: string,
  managerName: string,
  managerRole: string,
  input: ReturnComplimentInput,
  ipAddress?: string
) {
  const previous = await prisma.compliment.findUnique({ where: { id }, select: { status: true, insured: true, collaboratorId: true } });
  if (!previous || previous.status !== "PENDENTE_APROVACAO") throw new Error("Elogio não está pendente de aprovação");

  const [updated] = await Promise.all([
    prisma.compliment.update({ where: { id }, data: { status: "DEVOLVIDO_PARA_AJUSTE" } }),
    prisma.complimentApproval.create({
      data: { complimentId: id, managerId, action: "RETURNED", observation: input.observation },
    }),
  ]);

  await createAuditLog({
    userId: managerId,
    userName: managerName,
    userRole: managerRole,
    action: "RETURN_FOR_ADJUSTMENT",
    entityType: "Compliment",
    entityId: id,
    previousValue: { status: previous.status },
    newValue: { status: "DEVOLVIDO_PARA_AJUSTE" },
    ipAddress,
  });

  notifyComplimentReturned({
    id,
    insured: previous.insured,
    collaboratorId: previous.collaboratorId,
    observation: input.observation,
  }).catch(console.error);

  return updated;
}

export async function evaluateCompliment(
  id: string,
  directorId: string,
  directorName: string,
  directorRole: string,
  input: EvaluateComplimentInput,
  ipAddress?: string
) {
  const previous = await prisma.compliment.findUnique({ where: { id }, select: { status: true, insured: true, collaboratorId: true } });
  if (!previous || previous.status !== "PENDENTE_AVALIACAO") throw new Error("Elogio não está pendente de avaliação");

  const [updated] = await Promise.all([
    prisma.compliment.update({ where: { id }, data: { status: "AVALIADO" } }),
    prisma.complimentEvaluation.create({
      data: { complimentId: id, directorId, medal: input.medal, justification: input.justification, comment: input.comment },
    }),
  ]);

  await createAuditLog({
    userId: directorId,
    userName: directorName,
    userRole: directorRole,
    action: "EVALUATE",
    entityType: "Compliment",
    entityId: id,
    previousValue: { status: previous.status },
    newValue: { status: "AVALIADO", medal: input.medal },
    ipAddress,
  });

  notifyComplimentEvaluated({
    id,
    insured: previous.insured,
    collaboratorId: previous.collaboratorId,
    medal: input.medal,
    justification: input.justification,
  }).catch(console.error);

  return updated;
}

export async function reevaluateCompliment(
  id: string,
  directorId: string,
  directorName: string,
  directorRole: string,
  input: ReevaluateComplimentInput,
  ipAddress?: string
) {
  const evaluation = await prisma.complimentEvaluation.findUnique({
    where: { complimentId: id },
    select: { medal: true },
  });
  if (!evaluation) throw new Error("Elogio não foi avaliado ainda");

  const [updated] = await Promise.all([
    prisma.complimentEvaluation.update({ where: { complimentId: id }, data: { medal: input.medal, updatedAt: new Date() } }),
    prisma.complimentReevaluation.create({
      data: { complimentId: id, directorId, previousMedal: evaluation.medal, newMedal: input.medal, reason: input.reason },
    }),
  ]);

  const compliment = await prisma.compliment.findUnique({ where: { id }, select: { insured: true, collaboratorId: true } });

  await createAuditLog({
    userId: directorId,
    userName: directorName,
    userRole: directorRole,
    action: "REEVALUATE",
    entityType: "Compliment",
    entityId: id,
    previousValue: { medal: evaluation.medal },
    newValue: { medal: input.medal, reason: input.reason },
    ipAddress,
  });

  if (compliment) {
    notifyComplimentEvaluated({
      id,
      insured: compliment.insured,
      collaboratorId: compliment.collaboratorId,
      medal: input.medal,
      justification: input.reason,
    }).catch(console.error);
  }

  return updated;
}

export async function updateCompliment(
  id: string,
  userId: string,
  userName: string,
  userRole: string,
  data: Partial<CreateComplimentInput> & { attachmentUrl?: string; attachmentName?: string; attachmentType?: string },
  ipAddress?: string
) {
  const previous = await prisma.compliment.findUnique({ where: { id } });
  if (!previous) throw new Error("Elogio não encontrado");

  if (userRole === "COLLABORATOR" && previous.submittedById !== userId) {
    throw new Error("Sem permissão para editar este elogio");
  }

  if (!["PENDENTE_APROVACAO", "DEVOLVIDO_PARA_AJUSTE"].includes(previous.status) && userRole !== "ADMIN") {
    throw new Error("Este elogio não pode ser editado no status atual");
  }

  const updateData: Record<string, unknown> = {};
  if (data.insured) updateData.insured = data.insured;
  if (data.receivedAt) {
    const d = new Date(data.receivedAt);
    updateData.receivedAt = d;
    updateData.year = d.getFullYear();
    updateData.quarter = getQuarter(d);
  }
  if (data.branch) updateData.branch = data.branch;
  if (data.reason) updateData.reason = data.reason;
  if (data.collaboratorId) updateData.collaboratorId = data.collaboratorId;
  if (data.attachmentUrl !== undefined) updateData.attachmentUrl = data.attachmentUrl;
  if (data.attachmentName !== undefined) updateData.attachmentName = data.attachmentName;
  if (data.attachmentType !== undefined) updateData.attachmentType = data.attachmentType;

  if (previous.status === "DEVOLVIDO_PARA_AJUSTE") {
    updateData.status = "PENDENTE_APROVACAO";
  }

  const updated = await prisma.compliment.update({ where: { id }, data: updateData });

  await createAuditLog({
    userId,
    userName,
    userRole,
    action: "UPDATE",
    entityType: "Compliment",
    entityId: id,
    previousValue: { status: previous.status, insured: previous.insured },
    newValue: updateData,
    ipAddress,
  });

  if (previous.status === "DEVOLVIDO_PARA_AJUSTE") {
    const collaborator = await prisma.user.findUnique({ where: { id: previous.collaboratorId }, select: { areaId: true } });
    notifyManagerNewPending({
      id,
      insured: updated.insured,
      collaboratorId: updated.collaboratorId,
      areaId: collaborator?.areaId ?? null,
    }).catch(console.error);
  }

  return updated;
}
