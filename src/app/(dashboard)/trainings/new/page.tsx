import { requireAuth } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBranches } from "@/services/branch.service";
import { getManagerAreaIds } from "@/services/area.service";
import { TrainingForm } from "@/components/trainings/TrainingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Treinamento" };

export default async function NewTrainingPage() {
  const session = await requireAuth();
  const { role, id: userId, name: userName } = session.user;

  const PERSON_SELECT = "id, name, role, area:areas!users_area_id_fkey(name)";

  let collaborators: any[] = [];
  if (role === "ADMIN" || role === "DIRETOR_CENTRAL") {
    const { data } = await supabaseAdmin
      .from("users")
      .select(PERSON_SELECT)
      .eq("is_active", true)
      .in("role", ["COLLABORATOR", "MANAGER", "DIRECTOR", "DIRETOR_CENTRAL"])
      .order("name");
    collaborators = data ?? [];
  } else if (role === "MANAGER") {
    // Equipe e gestores das áreas sob sua responsabilidade, além do próprio gestor
    // (que pode não ter área vinculada ao cadastro)
    const areaIds = await getManagerAreaIds(userId);
    const [{ data: team }, { data: self }] = await Promise.all([
      areaIds.length > 0
        ? supabaseAdmin
            .from("users")
            .select(PERSON_SELECT)
            .eq("is_active", true)
            .in("role", ["COLLABORATOR", "MANAGER"])
            .in("area_id", areaIds)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin.from("users").select(PERSON_SELECT).eq("id", userId),
    ]);
    const byId = new Map([...(team ?? []), ...(self ?? [])].map((u: any) => [u.id, u]));
    collaborators = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  } else {
    const { data } = await supabaseAdmin.from("users").select(PERSON_SELECT).eq("id", userId);
    collaborators = data ?? [];
  }

  const defaultCollaborator = collaborators.find((c) => c.id === userId) ?? collaborators[0];
  const branches = await getBranches(true);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar Treinamento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre um treinamento, curso ou consultoria realizada
        </p>
      </div>
      <TrainingForm collaborators={collaborators} branches={branches} defaultCollaborator={defaultCollaborator} currentUserName={userName ?? ""} />
    </div>
  );
}
