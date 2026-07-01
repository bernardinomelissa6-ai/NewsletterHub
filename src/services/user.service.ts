import { supabaseAdmin } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit.service";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { CreateUserInput, UpdateUserInput } from "@/lib/validations/user.schema";

export async function createUser(input: CreateUserInput, createdById: string, createdByName: string, createdByRole: string) {
  const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", input.email).single();
  if (existing) throw new Error("E-mail já cadastrado");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const now = new Date().toISOString();

  const { data: user, error } = await supabaseAdmin.from("users").insert({
    id: randomUUID(),
    name: input.name,
    email: input.email,
    password_hash: passwordHash,
    role: input.role,
    area_id: input.areaId ?? null,
    email_verified: true,
    is_active: true,
    updated_at: now,
  }).select().single();

  if (error) throw error;

  await createAuditLog({ userId: createdById, userName: createdByName, userRole: createdByRole, action: "CREATE", entityType: "User", entityId: user.id, newValue: { name: user.name, email: user.email, role: user.role } });

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput, updatedById: string, updatedByName: string, updatedByRole: string) {
  const { data: previous } = await supabaseAdmin.from("users").select("*").eq("id", id).single();
  if (!previous) throw new Error("Usuário não encontrado");

  if (input.email && input.email !== previous.email) {
    const { data: existing } = await supabaseAdmin.from("users").select("id").eq("email", input.email).single();
    if (existing) throw new Error("E-mail já em uso");
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name) updateData.name = input.name;
  if (input.email) updateData.email = input.email;
  if (input.role) updateData.role = input.role;
  if (input.isActive !== undefined) updateData.is_active = input.isActive;
  if (input.areaId !== undefined) updateData.area_id = input.areaId ?? null;

  const { data: updated, error } = await supabaseAdmin.from("users").update(updateData).eq("id", id).select().single();
  if (error) throw error;

  await createAuditLog({ userId: updatedById, userName: updatedByName, userRole: updatedByRole, action: "UPDATE", entityType: "User", entityId: id, previousValue: { name: previous.name, role: previous.role, is_active: previous.is_active }, newValue: input });

  return updated;
}

export async function deactivateUser(id: string, adminId: string, adminName: string) {
  const { data: user } = await supabaseAdmin.from("users").select("id").eq("id", id).single();
  if (!user) throw new Error("Usuário não encontrado");

  await supabaseAdmin.from("users").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);

  await createAuditLog({ userId: adminId, userName: adminName, userRole: "ADMIN", action: "DEACTIVATE_ACCOUNT", entityType: "User", entityId: id, previousValue: { is_active: true }, newValue: { is_active: false } });
}

export async function getUsers(filters: { role?: string; areaId?: string; search?: string; page?: number; limit?: number } = {}) {
  const { role, areaId, search, page = 1, limit = 20 } = filters;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from("users")
    .select("id, name, email, role, is_active, email_verified, created_at, area:areas(id, name)", { count: "exact" })
    .order("name")
    .range(from, to);

  if (role) query = query.eq("role", role);
  if (areaId) query = query.eq("area_id", areaId);
  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, count, error } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return { data: data ?? [], total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(id: string) {
  const { data } = await supabaseAdmin.from("users").select("id, name, email, role, is_active, email_verified, area_id, created_at, area:areas(id, name)").eq("id", id).single();
  return data;
}

export async function resetUserPassword(id: string, newPassword: string, adminId: string, adminName: string) {
  const hash = await bcrypt.hash(newPassword, 12);
  await supabaseAdmin.from("users").update({ password_hash: hash, updated_at: new Date().toISOString() }).eq("id", id);
  await createAuditLog({ userId: adminId, userName: adminName, userRole: "ADMIN", action: "RESET_PASSWORD", entityType: "User", entityId: id });
}
