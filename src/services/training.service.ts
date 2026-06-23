import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "./audit.service";
import { getQuarter } from "@/lib/utils/quarters";
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

  const training = await prisma.training.create({
    data: {
      insured: input.insured,
      date,
      type: input.type,
      branch: input.branch,
      collaboratorId: input.collaboratorId,
      submittedById,
      attachmentUrl,
      attachmentName,
      attachmentType,
      year,
      quarter,
    },
  });

  await createAuditLog({
    userId: submittedById,
    userName: submittedByName,
    userRole: submittedByRole,
    action: "CREATE",
    entityType: "Training",
    entityId: training.id,
    newValue: { type: input.type, branch: input.branch, collaboratorId: input.collaboratorId },
    ipAddress,
  });

  return training;
}

export async function getTrainingById(id: string) {
  return prisma.training.findUnique({
    where: { id },
    include: {
      collaborator: { include: { area: true } },
      submittedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getTrainings(filter: TrainingFilterInput, userId: string, userRole: string) {
  const { page, limit, type, collaboratorId, areaId, year, quarter, search } = filter;
  const skip = (page - 1) * limit;

  let where: Record<string, unknown> = {};

  if (userRole === "COLLABORATOR") {
    where.collaboratorId = userId;
  } else if (userRole === "MANAGER") {
    const areas = await prisma.area.findMany({ where: { managerId: userId }, select: { id: true } });
    where.collaborator = { areaId: { in: areas.map((a) => a.id) } };
  }

  if (type) where.type = type;
  if (collaboratorId && userRole !== "COLLABORATOR") where.collaboratorId = collaboratorId;
  if (areaId && userRole !== "COLLABORATOR" && userRole !== "MANAGER") {
    where.collaborator = { areaId };
  }
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;
  if (search) {
    where.OR = [
      { insured: { contains: search, mode: "insensitive" } },
      { collaborator: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.training.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        collaborator: { select: { id: true, name: true, area: { select: { name: true } } } },
        submittedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.training.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteTraining(id: string, userId: string, userName: string, userRole: string) {
  const training = await prisma.training.findUnique({ where: { id } });
  if (!training) throw new Error("Treinamento não encontrado");
  if (userRole !== "ADMIN" && training.submittedById !== userId) throw new Error("Sem permissão");

  await prisma.training.delete({ where: { id } });

  await createAuditLog({
    userId,
    userName,
    userRole,
    action: "DELETE",
    entityType: "Training",
    entityId: id,
    previousValue: { type: training.type, branch: training.branch },
  });
}
