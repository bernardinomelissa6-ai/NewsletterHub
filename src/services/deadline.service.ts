import { supabaseAdmin } from "@/lib/supabase/admin";
import type { DeadlineType } from "@/lib/supabase/types";
import { randomUUID } from "crypto";

export async function getDeadlines() {
  const { data } = await supabaseAdmin.from("deadlines").select("*").order("type");
  return data ?? [];
}

export async function getDeadline(type: DeadlineType) {
  const { data } = await supabaseAdmin.from("deadlines").select("*").eq("type", type).single();
  return data;
}

export async function upsertDeadline(type: DeadlineType, days: number) {
  const existing = await getDeadline(type);
  const now = new Date().toISOString();
  if (existing) {
    const { data } = await supabaseAdmin.from("deadlines").update({ days, updated_at: now }).eq("type", type).select().single();
    return data;
  } else {
    const { data } = await supabaseAdmin.from("deadlines").insert({ id: randomUUID(), type, days, updated_at: now }).select().single();
    return data;
  }
}

export async function getDeadlineMap(): Promise<Record<DeadlineType, number>> {
  const deadlines = await getDeadlines();
  const defaults: Record<DeadlineType, number> = { REGISTRATION: 30, APPROVAL: 7, EVALUATION: 5, CENTRAL_EVALUATION: 3 };
  for (const d of deadlines) {
    defaults[d.type as DeadlineType] = d.days;
  }
  return defaults;
}
