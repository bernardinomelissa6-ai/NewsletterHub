import { supabaseAdmin } from "@/lib/supabase/admin";
import { deleteFile } from "@/lib/storage/supabase-storage";
import type { MedalType } from "@/lib/supabase/types";
import { randomUUID } from "crypto";

export async function getMedalImages(): Promise<Record<MedalType, string | null>> {
  const { data } = await supabaseAdmin.from("medal_images").select("medal_type, image_url");
  const map: Record<MedalType, string | null> = { BRONZE: null, SILVER: null, GOLD: null, SPECIAL: null };
  for (const row of data ?? []) {
    map[row.medal_type as MedalType] = row.image_url;
  }
  return map;
}

export async function upsertMedalImage(type: MedalType, imageUrl: string) {
  const { data: existing } = await supabaseAdmin.from("medal_images").select("id, image_url").eq("medal_type", type).maybeSingle();
  const now = new Date().toISOString();

  if (existing) {
    if (existing.image_url && existing.image_url !== imageUrl) {
      deleteFile(existing.image_url).catch(console.error);
    }
    const { data } = await supabaseAdmin.from("medal_images").update({ image_url: imageUrl, updated_at: now }).eq("id", existing.id).select().single();
    return data;
  }

  const { data } = await supabaseAdmin.from("medal_images").insert({ id: randomUUID(), medal_type: type, image_url: imageUrl, updated_at: now }).select().single();
  return data;
}

export async function deleteMedalImage(type: MedalType) {
  const { data: existing } = await supabaseAdmin.from("medal_images").select("id, image_url").eq("medal_type", type).maybeSingle();
  if (!existing) return;
  if (existing.image_url) deleteFile(existing.image_url).catch(console.error);
  await supabaseAdmin.from("medal_images").delete().eq("id", existing.id);
}
