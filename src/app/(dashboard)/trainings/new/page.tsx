import { requireAuth } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { TrainingForm } from "@/components/trainings/TrainingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Treinamento" };

export default async function NewTrainingPage() {
  const session = await requireAuth();
  const { role, id: userId } = session.user;

  let collaborators: any[] = [];
  if (role === "ADMIN" || role === "DIRETOR_CENTRAL") {
    const { data } = await supabaseAdmin.from("users").select("id, name, area:areas(name)").eq("is_active", true).eq("role", "COLLABORATOR").order("name");
    collaborators = data ?? [];
  } else if (role === "MANAGER") {
    const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", userId);
    const areaIds = (areas ?? []).map((a) => a.id);
    const { data } = await supabaseAdmin.from("users").select("id, name, area:areas(name)").eq("is_active", true).eq("role", "COLLABORATOR").in("area_id", areaIds).order("name");
    collaborators = data ?? [];
  } else {
    const { data } = await supabaseAdmin.from("users").select("id, name, area:areas(name)").eq("id", userId);
    collaborators = data ?? [];
  }

  const defaultCollaboratorId = collaborators.length === 1 ? collaborators[0]?.id : undefined;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar Treinamento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre um treinamento, curso ou consultoria realizada
        </p>
      </div>
      <TrainingForm collaborators={collaborators} defaultCollaboratorId={defaultCollaboratorId} />
    </div>
  );
}
