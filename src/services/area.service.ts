import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "./audit.service";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations/area.schema";

export async function createArea(input: CreateAreaInput, adminId: string, adminName: string) {
  const area = await prisma.area.create({
    data: {
      name: input.name,
      managerId: input.managerId ?? null,
      directorId: input.directorId ?? null,
    },
  });

  await createAuditLog({
    userId: adminId,
    userName: adminName,
    userRole: "ADMIN",
    action: "CREATE",
    entityType: "Area",
    entityId: area.id,
    newValue: { name: area.name },
  });

  return area;
}

export async function updateArea(id: string, input: UpdateAreaInput, adminId: string, adminName: string) {
  const previous = await prisma.area.findUnique({ where: { id } });
  if (!previous) throw new Error("Área não encontrada");

  const updated = await prisma.area.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      managerId: input.managerId !== undefined ? (input.managerId ?? null) : previous.managerId,
      directorId: input.directorId !== undefined ? (input.directorId ?? null) : previous.directorId,
    },
  });

  await createAuditLog({
    userId: adminId,
    userName: adminName,
    userRole: "ADMIN",
    action: "UPDATE",
    entityType: "Area",
    entityId: id,
    previousValue: { name: previous.name, managerId: previous.managerId, directorId: previous.directorId },
    newValue: input,
  });

  return updated;
}

export async function deleteArea(id: string, adminId: string, adminName: string) {
  const area = await prisma.area.findUnique({ where: { id } });
  if (!area) throw new Error("Área não encontrada");

  const hasUsers = await prisma.user.count({ where: { areaId: id } });
  if (hasUsers > 0) throw new Error("Não é possível excluir área com colaboradores vinculados");

  await prisma.area.delete({ where: { id } });

  await createAuditLog({
    userId: adminId,
    userName: adminName,
    userRole: "ADMIN",
    action: "DELETE",
    entityType: "Area",
    entityId: id,
    previousValue: { name: area.name },
  });
}

export async function getAreas(search?: string) {
  return prisma.area.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: {
      manager: { select: { id: true, name: true } },
      director: { select: { id: true, name: true } },
      _count: { select: { collaborators: true } },
    },
  });
}

export async function getAreaById(id: string) {
  return prisma.area.findUnique({
    where: { id },
    include: {
      manager: { select: { id: true, name: true, email: true } },
      director: { select: { id: true, name: true, email: true } },
      collaborators: { select: { id: true, name: true, email: true, role: true, isActive: true } },
    },
  });
}
