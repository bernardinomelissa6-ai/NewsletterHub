import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyEvaluationsList } from "@/components/compliments/MyEvaluationsList";
import { calculateFinalMedal } from "@/lib/utils/medal-calculation";
import type { MedalType } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minhas Avaliações" };

const isCentral = (role: string) => ["DIRETOR_CENTRAL", "ADMIN"].includes(role);

async function getMyEvaluations(userId: string) {
  const { data: myEvals } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("compliment_id, medal, created_at")
    .eq("director_id", userId)
    .order("created_at", { ascending: false });

  if (!myEvals || myEvals.length === 0) return [];

  const complimentIds = myEvals.map((e: any) => e.compliment_id);

  const { data: compliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, branch, reason, received_at, quarter, year, status, attachment_url, collaborator_id")
    .in("id", complimentIds);

  if (!compliments || compliments.length === 0) return [];

  const collaboratorIds = [...new Set(compliments.map((c: any) => c.collaborator_id).filter(Boolean))];
  const { data: collaborators } = collaboratorIds.length > 0
    ? await supabaseAdmin.from("users").select("id, name").in("id", collaboratorIds)
    : { data: [] };

  const collaboratorMap = new Map((collaborators ?? []).map((u: any) => [u.id, u.name]));

  const { data: allEvals } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("compliment_id, director_id, medal")
    .in("compliment_id", complimentIds);

  const directorIds = [...new Set((allEvals ?? []).map((e: any) => e.director_id).filter(Boolean))];
  const { data: directors } = directorIds.length > 0
    ? await supabaseAdmin.from("users").select("id, role").in("id", directorIds)
    : { data: [] };

  const roleMap = new Map((directors ?? []).map((u: any) => [u.id, u.role]));

  const finalMedalMap = new Map<string, MedalType>();
  for (const cid of complimentIds) {
    const evals = (allEvals ?? []).filter((e: any) => e.compliment_id === cid);
    try {
      const { finalMedal } = calculateFinalMedal(
        evals.map((e: any) => ({ medal: e.medal as MedalType, isCentralDirector: isCentral(roleMap.get(e.director_id) ?? "") }))
      );
      finalMedalMap.set(cid, finalMedal);
    } catch {
      // Not enough evaluations yet — no final medal
    }
  }

  const complimentMap = new Map(compliments.map((c: any) => [c.id, c]));

  return myEvals
    .map((e: any) => {
      const c = complimentMap.get(e.compliment_id);
      if (!c) return null;
      return {
        id: c.id,
        insured: c.insured,
        branch: c.branch,
        reason: c.reason,
        received_at: c.received_at,
        quarter: c.quarter,
        year: c.year,
        status: c.status,
        attachment_url: c.attachment_url,
        collaborator_name: collaboratorMap.get(c.collaborator_id) ?? null,
        my_medal: e.medal as MedalType,
        final_medal: c.status === "AVALIADO" ? (finalMedalMap.get(c.id) ?? null) : null,
        evaluated_at: e.created_at,
      };
    })
    .filter(Boolean);
}

export default async function MinhasAvaliacoesPage() {
  const session = await requireRole("DIRECTOR", "DIRETOR_CENTRAL");
  const evaluations = await getMyEvaluations(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minhas Avaliações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {evaluations.length} elogio{evaluations.length !== 1 ? "s" : ""} avaliado{evaluations.length !== 1 ? "s" : ""} por você
        </p>
      </div>
      <MyEvaluationsList evaluations={evaluations as any} />
    </div>
  );
}
