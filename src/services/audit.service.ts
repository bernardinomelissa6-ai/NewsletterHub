import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AuditAction } from "@/lib/supabase/types";
import { randomUUID } from "crypto";

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
    await supabaseAdmin.from("audit_logs").insert({
      id: randomUUID(),
      user_id: input.userId,
      user_name: input.userName,
      user_role: input.userRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      previous_value: input.previousValue ?? null,
      new_value: input.newValue ?? null,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
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
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("audit_logs")
    .select("*, user:users(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (userId) query = query.eq("user_id", userId);
  if (action) query = query.eq("action", action);
  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (startDate) query = query.gte("created_at", startDate.toISOString());
  if (endDate) query = query.lte("created_at", endDate.toISOString());
  if (search) query = query.or(`user_name.ilike.%${search}%,entity_type.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return { data: data ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
}
