import { supabaseAdmin } from "@/lib/supabase/admin";
import { createAuditLog } from "./audit.service";
import { randomUUID } from "crypto";
import type { CreateAreaInput, UpdateAreaInput } from "@/lib/validations/area.schema";

export async function createArea(input: CreateAreaInput, adminId: string, adminName: string) {
  const { data: area, error } = await supabaseAdmin.from("areas").insert({
    id: randomUUID(),
    name: input.name,
    manager_id: input.managerId ?? null,
    director_id: input.directorId ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  }).select().single();

  if (error) throw error;

  await createAuditLog({ userId: adminId, userName: adminName, userRole: "ADMIN", action: "CREATE", entityType: "Area", entityId: area.id, newValue: { name: area.name } });

  return area;
}

export async function updateArea(id: string, input: UpdateAreaInput, adminId: string, adminName: string) {
  const { data: previous } = await supabaseAdmin.from("areas").select("*").eq("id", id).single();
  if (!previous) throw new Error("Área não encontrada");

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name) updateData.name = input.name;
  if (input.managerId !== undefined) updateData.manager_id = input.managerId ?? null;
  if (input.directorId !== undefined) updateData.director_id = input.directorId ?? null;

  const { data: updated, error } = await supabaseAdmin.from("areas").update(updateData).eq("id", id).select().single();
  if (error) throw error;

  await createAuditLog({ userId: adminId, userName: adminName, userRole: "ADMIN", action: "UPDATE", entityType: "Area", entityId: id, previousValue: { name: previous.name, manager_id: previous.manager_id, director_id: previous.director_id }, newValue: input });

  return updated;
}

export async function deleteArea(id: string, adminId: string, adminName: string) {
  const { data: area } = await supabaseAdmin.from("areas").select("*").eq("id", id).single();
  if (!area) throw new Error("Área não encontrada");

  const { count } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true }).eq("area_id", id);
  if ((count ?? 0) > 0) throw new Error("Não é possível excluir área com colaboradores vinculados");

  await supabaseAdmin.from("areas").delete().eq("id", id);

  await createAuditLog({ userId: adminId, userName: adminName, userRole: "ADMIN", action: "DELETE", entityType: "Area", entityId: id, previousValue: { name: area.name } });
}

export async function getAreas(search?: string) {
  let query = supabaseAdmin
    .from("areas")
    .select("*, manager:users!areas_manager_id_fkey(id, name), director:users!areas_director_id_fkey(id, name), collaborators:users(id)")
    .order("name");

  if (search) query = query.ilike("name", `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((a) => ({
    ...a,
    _count: { collaborators: Array.isArray(a.collaborators) ? a.collaborators.length : 0 },
    collaborators: undefined,
  }));
}

export async function getAreaById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("areas")
    .select("*, manager:users!areas_manager_id_fkey(id, name, email), director:users!areas_director_id_fkey(id, name, email), collaborators:users(id, name, email, role, is_active)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}
