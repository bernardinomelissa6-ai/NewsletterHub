import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AreaForm } from "@/components/areas/AreaForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Área" };

export default async function EditAreaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const { data: area } = await supabaseAdmin.from("areas").select("*").eq("id", id).single();
  if (!area) notFound();

  const [{ data: managers }, { data: directors }] = await Promise.all([
    supabaseAdmin.from("users").select("id, name").in("role", ["MANAGER", "ADMIN"]).eq("is_active", true).order("name"),
    supabaseAdmin.from("users").select("id, name").eq("role", "DIRECTOR").eq("is_active", true).order("name"),
  ]);

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Área</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
      </div>
      <AreaForm
        managers={managers ?? []}
        directors={directors ?? []}
        areaId={area.id}
        defaultValues={{
          name: area.name,
          managerId: area.manager_id ?? "",
          directorId: area.director_id ?? "",
        }}
      />
    </div>
  );
}
