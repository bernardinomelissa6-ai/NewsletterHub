import { requireRole } from "@/lib/auth/session";
import { getPendingEvaluationsForCentralDirector } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingEvaluationList } from "@/components/compliments/PendingEvaluationList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avaliação de Elogios" };

async function getAdminPendingEvaluations() {
  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, received_at, branch, reason, status, quarter, year, created_at, collaborator_id, submitted_by_id")
    .eq("status", "PENDENTE_AVALIACAO")
    .order("created_at");

  if (!rawCompliments || rawCompliments.length === 0) return [];

  const complimentIds = rawCompliments.map((c) => c.id);

  const allUserIds = [...new Set([
    ...rawCompliments.map((c) => c.collaborator_id),
    ...rawCompliments.map((c) => c.submitted_by_id),
  ].filter(Boolean))];

  // Audit fallback IDs (records with no user references)
  const orphanIds = rawCompliments.filter((c) => !c.collaborator_id && !c.submitted_by_id).map((c) => c.id);

  // Run all independent queries in parallel
  const [{ data: usersRaw }, { data: approvalsData }, { data: evaluationsData }, { data: auditData }] = await Promise.all([
    allUserIds.length > 0 ? supabaseAdmin.from("users").select("id, name, area_id").in("id", allUserIds) : Promise.resolve({ data: [] }),
    supabaseAdmin.from("compliment_approvals").select("compliment_id, action, observation, created_at, manager_id").in("compliment_id", complimentIds),
    supabaseAdmin.from("compliment_evaluations").select("compliment_id, medal, justification, director_id").in("compliment_id", complimentIds),
    orphanIds.length > 0 ? supabaseAdmin.from("audit_logs").select("entity_id, user_name").eq("action", "CREATE").eq("entity_type", "Compliment").in("entity_id", orphanIds) : Promise.resolve({ data: [] }),
  ]);

  const auditMap = new Map((auditData ?? []).map((a: any) => [a.entity_id, a.user_name]));

  const areaIds = [...new Set((usersRaw ?? []).map((u: any) => u.area_id).filter(Boolean))];
  const managerIds = [...new Set((approvalsData ?? []).map((a: any) => a.manager_id).filter(Boolean))];
  const directorIds = [...new Set((evaluationsData ?? []).map((e: any) => e.director_id).filter(Boolean))];

  const [{ data: areasData }, { data: managersData }, { data: directorsData }] = await Promise.all([
    areaIds.length > 0 ? supabaseAdmin.from("areas").select("id, name").in("id", areaIds) : Promise.resolve({ data: [] }),
    managerIds.length > 0 ? supabaseAdmin.from("users").select("id, name").in("id", managerIds) : Promise.resolve({ data: [] }),
    directorIds.length > 0 ? supabaseAdmin.from("users").select("id, name, role").in("id", directorIds) : Promise.resolve({ data: [] }),
  ]);

  const areaMap = new Map((areasData ?? []).map((a: any) => [a.id, a.name]));
  const userMap = new Map((usersRaw ?? []).map((u: any) => [u.id, {
    id: u.id, name: u.name,
    area: u.area_id ? { name: areaMap.get(u.area_id) ?? "" } : null,
  }]));

  const managerMap = new Map((managersData ?? []).map((u: any) => [u.id, u]));
  const directorMap = new Map((directorsData ?? []).map((u: any) => [u.id, u]));

  return rawCompliments.map((c) => ({
    ...c,
    collaborator:
      userMap.get(c.collaborator_id) ??
      userMap.get(c.submitted_by_id) ??
      (auditMap.has(c.id) ? { id: null, name: auditMap.get(c.id)!, area: null } : { id: null, name: "—", area: null }),
    approvals: (approvalsData ?? [])
      .filter((a: any) => a.compliment_id === c.id)
      .map((a: any) => ({ ...a, manager: managerMap.get(a.manager_id) ?? { name: "—" } })),
    evaluations: (evaluationsData ?? [])
      .filter((e: any) => e.compliment_id === c.id)
      .map((e: any) => ({
        ...e,
        director: directorMap.get(e.director_id) ?? { name: "—", role: "DIRECTOR" },
      })),
  }));
}

export default async function PendingEvaluationPage() {
  const session = await requireRole("DIRECTOR", "DIRETOR_CENTRAL", "ADMIN");
  const { role, id: userId } = session.user;

  let compliments: any[];
  if (role === "DIRETOR_CENTRAL") {
    compliments = await getPendingEvaluationsForCentralDirector(userId);
  } else {
    // ADMIN e DIRECTOR usam a mesma query manual (sem FK joins que podem falhar)
    compliments = await getAdminPendingEvaluations();
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
