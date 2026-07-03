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
  let query = supabaseAdmin.from("areas").select("id, name, manager_id, director_id, is_active, updated_at").order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  const { data: areas, error } = await query;
  if (error) throw error;
  if (!areas || areas.length === 0) return [];

  const userIds = [...new Set([
    ...areas.map((a: any) => a.manager_id),
    ...areas.map((a: any) => a.director_id),
  ].filter(Boolean))];

  const { data: users } = userIds.length > 0
    ? await supabaseAdmin.from("users").select("id, name").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));

  const { data: collaboratorCounts } = await supabaseAdmin
    .from("users")
    .select("area_id")
    .in("area_id", areas.map((a: any) => a.id))
    .eq("role", "COLLABORATOR")
    .eq("is_active", true);

  const countMap = new Map<string, number>();
  for (const u of collaboratorCounts ?? []) {
    countMap.set(u.area_id, (countMap.get(u.area_id) ?? 0) + 1);
  }

  return areas.map((a: any) => ({
    ...a,
    manager: a.manager_id ? userMap.get(a.manager_id) ?? null : null,
    director: a.director_id ? userMap.get(a.director_id) ?? null : null,
    _count: { collaborators: countMap.get(a.id) ?? 0 },
  }));
}

export async function getAreaById(id: string) {
  const { data: area, error } = await supabaseAdmin
    .from("areas")
    .select("id, name, manager_id, director_id, is_active, updated_at")
    .eq("id", id)
    .single();

  if (error || !area) return null;

  const userIds = [area.manager_id, area.director_id].filter(Boolean) as string[];
  const { data: users } = userIds.length > 0
    ? await supabaseAdmin.from("users").select("id, name, email").in("id", userIds)
    : { data: [] };
  const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));

  const { data: collaborators } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, is_active")
    .eq("area_id", id);

  return {
    ...area,
    manager: area.manager_id ? userMap.get(area.manager_id) ?? null : null,
    director: area.director_id ? userMap.get(area.director_id) ?? null : null,
    collaborators: collaborators ?? [],
  };
}
