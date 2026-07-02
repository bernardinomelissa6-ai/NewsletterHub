import { requireAuth } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getBranches } from "@/services/branch.service";
import { ComplimentForm } from "@/components/compliments/ComplimentForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Elogio" };

export default async function NewComplimentPage() {
  const session = await requireAuth();
  const { role, id: userId, name: userName } = session.user;

  let collaborators: { id: string; name: string; area: { name: string } | null }[] = [];

  if (role === "ADMIN" || role === "DIRETOR_CENTRAL") {
    const { data: users } = await supabaseAdmin.from("users").select("id, name, area_id").eq("is_active", true).eq("role", "COLLABORATOR").order("name");
    const areaIds = [...new Set((users ?? []).map((u) => u.area_id).filter(Boolean))];
    const { data: areas } = areaIds.length > 0 ? await supabaseAdmin.from("areas").select("id, name").in("id", areaIds) : { data: [] };
    const areaMap = new Map((areas ?? []).map((a) => [a.id, a.name]));
    collaborators = (users ?? []).map((u) => ({ id: u.id, name: u.name, area: u.area_id ? { name: areaMap.get(u.area_id) ?? "" } : null }));
  } else if (role === "MANAGER") {
    const { data: managerAreas } = await supabaseAdmin.from("areas").select("id, name").eq("manager_id", userId);
    const areaIds = (managerAreas ?? []).map((a) => a.id);
    const areaMap = new Map((managerAreas ?? []).map((a) => [a.id, a.name]));
    const { data: users } = areaIds.length > 0
      ? await supabaseAdmin.from("users").select("id, name, area_id").eq("is_active", true).eq("role", "COLLABORATOR").in("area_id", areaIds).order("name")
      : { data: [] };
    collaborators = (users ?? []).map((u) => ({ id: u.id, name: u.name, area: u.area_id ? { name: areaMap.get(u.area_id) ?? "" } : null }));
  } else {
    const { data: users } = await supabaseAdmin.from("users").select("id, name").eq("id", userId);
    collaborators = (users ?? []).map((u) => ({ id: u.id, name: u.name, area: null }));
  }

  const branches = await getBranches(true);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar Elogio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre um elogio recebido de cliente, segurado, parceiro ou corretor
        </p>
      </div>
      <ComplimentForm collaborators={collaborators} branches={branches} defaultCollaboratorName={collaborators[0]?.name ?? userName ?? ""} defaultCollaboratorId={collaborators[0]?.id} currentUserName={userName ?? ""} />
    </div>
  );
}
