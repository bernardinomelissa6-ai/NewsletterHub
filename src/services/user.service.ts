import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "./audit.service";
import bcrypt from "bcryptjs";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user.schema";

export async function createUser(input: CreateUserInput, createdById: string, createdByName: string, createdByRole: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new Error("E-mail já cadastrado");

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      areaId: input.areaId ?? null,
      emailVerified: true,
      isActive: true,
    },
  });

  await createAuditLog({
    userId: createdById,
    userName: createdByName,
    userRole: createdByRole,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    newValue: { name: user.name, email: user.email, role: user.role },
  });

  return user;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  updatedById: string,
  updatedByName: string,
  updatedByRole: string
) {
  const previous = await prisma.user.findUnique({ where: { id } });
  if (!previous) throw new Error("Usuário não encontrado");

  if (input.email && input.email !== previous.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error("E-mail já em uso");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.email && { email: input.email }),
      ...(input.role && { role: input.role }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      areaId: input.areaId !== undefined ? (input.areaId ?? null) : previous.areaId,
    },
  });

  await createAuditLog({
    userId: updatedById,
    userName: updatedByName,
    userRole: updatedByRole,
    action: "UPDATE",
    entityType: "User",
    entityId: id,
    previousValue: { name: previous.name, role: previous.role, isActive: previous.isActive },
    newValue: input,
  });

  return updated;
}

export async function deactivateUser(id: string, adminId: string, adminName: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("Usuário não encontrado");

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  await createAuditLog({
    userId: adminId,
    userName: adminName,
    userRole: "ADMIN",
    action: "DEACTIVATE_ACCOUNT",
    entityType: "User",
    entityId: id,
    previousValue: { isActive: true },
    newValue: { isActive: false },
  });
}

export async function getUsers(filters: { role?: string; areaId?: string; search?: string; page?: number; limit?: number } = {}) {
  const { role, areaId, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (role) where.role = role;
  if (areaId) where.areaId = areaId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        area: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerified: true,
      areaId: true,
      createdAt: true,
      area: { select: { id: true, name: true } },
    },
  });
}

export async function resetUserPassword(id: string, newPassword: string, adminId: string, adminName: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash: hash } });

  await createAuditLog({
    userId: adminId,
    userName: adminName,
    userRole: "ADMIN",
    action: "RESET_PASSWORD",
    entityType: "User",
    entityId: id,
  });
}
