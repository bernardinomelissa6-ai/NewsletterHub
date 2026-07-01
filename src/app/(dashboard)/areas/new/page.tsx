import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AreaForm } from "@/components/areas/AreaForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova Área" };

export default async function NewAreaPage() {
  await requireRole("ADMIN");

  const [{ data: managers }, { data: directors }] = await Promise.all([
    supabaseAdmin.from("users").select("id, name").in("role", ["MANAGER", "ADMIN"]).eq("is_active", true).order("name"),
    supabaseAdmin.from("users").select("id, name").eq("role", "DIRECTOR").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Área</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastre uma nova área organizacional</p>
      </div>
      <AreaForm managers={managers ?? []} directors={directors ?? []} />
    </div>
  );
}
