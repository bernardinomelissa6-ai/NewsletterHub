import { requireRole } from "@/lib/auth/session";
import { getPendingEvaluations, getPendingEvaluationsForCentralDirector } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingEvaluationList } from "@/components/compliments/PendingEvaluationList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avaliação de Elogios" };

async function getAdminPendingEvaluations() {
  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, received_at, branch, reason, status, quarter, year, created_at, collaborator_id")
    .eq("status", "PENDENTE_AVALIACAO")
    .order("created_at");

  if (!rawCompliments || rawCompliments.length === 0) return [];

  const collIds = [...new Set(rawCompliments.map((c) => c.collaborator_id).filter(Boolean))];
  const complimentIds = rawCompliments.map((c) => c.id);

  const [{ data: collData }, { data: approvalsData }, { data: evaluationsData }] = await Promise.all([
    supabaseAdmin.from("users").select("id, name, area:areas(name)").in("id", collIds),
    supabaseAdmin.from("compliment_approvals").select("compliment_id, action, observation, created_at, manager_id").in("compliment_id", complimentIds),
    supabaseAdmin.from("compliment_evaluations").select("compliment_id, medal, justification, director_id").in("compliment_id", complimentIds),
  ]);

  const collMap = new Map((collData ?? []).map((u: any) => [u.id, u]));

  const managerIds = [...new Set((approvalsData ?? []).map((a: any) => a.manager_id).filter(Boolean))];
  const directorIds = [...new Set((evaluationsData ?? []).map((e: any) => e.director_id).filter(Boolean))];

  const [{ data: managersData }, { data: directorsData }] = await Promise.all([
    managerIds.length > 0 ? supabaseAdmin.from("users").select("id, name").in("id", managerIds) : Promise.resolve({ data: [] }),
    directorIds.length > 0 ? supabaseAdmin.from("users").select("id, name, role").in("id", directorIds) : Promise.resolve({ data: [] }),
  ]);

  const managerMap = new Map((managersData ?? []).map((u: any) => [u.id, u]));
  const directorMap = new Map((directorsData ?? []).map((u: any) => [u.id, u]));

  return rawCompliments.map((c) => ({
    ...c,
    collaborator: collMap.get(c.collaborator_id) ?? { id: c.collaborator_id, name: "Desconhecido", area: null },
    approvals: (approvalsData ?? [])
      .filter((a: any) => a.compliment_id === c.id)
      .map((a: any) => ({ ...a, manager: managerMap.get(a.manager_id) ?? { name: "Desconhecido" } })),
    evaluations: (evaluationsData ?? [])
      .filter((e: any) => e.compliment_id === c.id)
      .map((e: any) => ({
        ...e,
        director: directorMap.get(e.director_id) ?? { name: "Desconhecido", role: "DIRECTOR" },
      })),
  }));
}

export default async function PendingEvaluationPage() {
  const session = await requireRole("DIRECTOR", "DIRETOR_CENTRAL", "ADMIN");
  const { role, id: userId } = session.user;

  let compliments: any[];
  if (role === "ADMIN") {
    compliments = await getAdminPendingEvaluations();
  } else if (role === "DIRETOR_CENTRAL") {
    compliments = await getPendingEvaluationsForCentralDirector(userId);
  } else {
    compliments = await getPendingEvaluations(userId);
  }

  const isCentralDirector = role === "DIRETOR_CENTRAL";

  const subtitle =
    role === "DIRETOR_CENTRAL"
      ? `${compliments.length} elogio${compliments.length !== 1 ? "s" : ""} aguardando sua avaliação final`
      : `${compliments.length} elogio${compliments.length !== 1 ? "s" : ""} aguardando avaliação`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliação de Elogios</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      <PendingEvaluationList
        compliments={compliments}
        currentUserId={userId}
        isCentralDirector={isCentralDirector}
      />
    </div>
  );
}
