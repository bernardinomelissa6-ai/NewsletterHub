import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export async function getBranches(onlyActive = true) {
  let query = supabaseAdmin.from("branches").select("id, name, is_active").order("name");
  if (onlyActive) query = query.eq("is_active", true);
  const { data } = await query;
  return data ?? [];
}

export async function createBranch(name: string) {
  const { data, error } = await supabaseAdmin
    .from("branches")
    .insert({ id: randomUUID(), name: name.trim(), updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBranch(id: string, name: string) {
  const { error } = await supabaseAdmin
    .from("branches")
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function toggleBranch(id: string, is_active: boolean) {
  const { error } = await supabaseAdmin
    .from("branches")
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBranch(id: string) {
  const { error } = await supabaseAdmin.from("branches").delete().eq("id", id);
  if (error) throw error;
}
