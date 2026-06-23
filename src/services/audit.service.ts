import { prisma } from "@/lib/db/prisma";
import type { AuditAction } from "@prisma/client";

export interface AuditLogInput {
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        userRole: input.userRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        previousValue: input.previousValue ?? undefined,
        newValue: input.newValue ?? undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (err) {
    console.error("[AuditService] Falha ao registrar log:", err);
  }
}

export interface AuditFilter {
  userId?: string;
  action?: AuditAction;
  entityType?: string;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(filter: AuditFilter = {}) {
  const { page = 1, limit = 50, userId, action, entityType, entityId, startDate, endDate, search } = filter;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    ...(userId && { userId }),
    ...(action && { action }),
    ...(entityType && { entityType }),
    ...(entityId && { entityId }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { userName: { contains: search, mode: "insensitive" as const } },
        { entityType: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}
