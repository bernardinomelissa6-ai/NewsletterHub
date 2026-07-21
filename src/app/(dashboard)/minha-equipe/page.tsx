import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyTeamEvaluatedList } from "@/components/compliments/MyTeamEvaluatedList";
import { calculateFinalMedal } from "@/lib/utils/medal-calculation";
import type { MedalType } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Minha Equipe" };

const isCentral = (role: string) => ["DIRETOR_CENTRAL", "ADMIN"].includes(role);

async function getMyTeamEvaluatedCompliments(directorId: string) {
  const { data: myAreas } = await supabaseAdmin.from("areas").select("id, name").eq("director_id", directorId);
  if (!myAreas || myAreas.length === 0) return { compliments: [], areaNames: [] as string[] };

  const areaIds = myAreas.map((a: any) => a.id);
  const areaNameMap = new Map(myAreas.map((a: any) => [a.id, a.name as string]));

  const { data: collaborators } = await supabaseAdmin.from("users").select("id, name, area_id").in("area_id", areaIds);
  if (!collaborators || collaborators.length === 0) {
    return { compliments: [], areaNames: myAreas.map((a: any) => a.name as string) };
  }

  const collaboratorIds = collaborators.map((c: any) => c.id);
  const collaboratorMap = new Map(collaborators.map((c: any) => [c.id, c]));

  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, branch, reason, claim_history, received_at, quarter, year, status, attachment_url, collaborator_id")
    .in("collaborator_id", collaboratorIds)
    .eq("status", "AVALIADO")
    .order("received_at", { ascending: false });

  if (!rawCompliments || rawCompliments.length === 0) {
    return { compliments: [], areaNames: myAreas.map((a: any) => a.name as string) };
  }

  const complimentIds = rawCompliments.map((c: any) => c.id);
  const { data: evalData } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("compliment_id, director_id, medal, justification, comment, created_at")
    .in("compliment_id", complimentIds);

  const directorIds = [...new Set((evalData ?? []).map((e: any) => e.director_id).filter(Boolean))];
  const { data: directors } = directorIds.length > 0
    ? await supabaseAdmin.from("users").select("id, name, role").in("id", directorIds)
    : { data: [] };
  const directorMap = new Map((directors ?? []).map((u: any) => [u.id, u]));

  const compliments = rawCompliments.map((c: any) => {
    const evals = (evalData ?? []).filter((e: any) => e.compliment_id === c.id);

    let finalMedal: MedalType | null = null;
    try {
      finalMedal = calculateFinalMedal(
        evals.map((e: any) => ({
          medal: e.medal as MedalType,
          isCentralDirector: isCentral(directorMap.get(e.director_id)?.role ?? ""),
        }))
      ).finalMedal;
    } catch {
      // Avaliações insuficientes para calcular a medalha final — mantém null
    }

    const collaborator = collaboratorMap.get(c.collaborator_id);

    return {
      id: c.id,
      insured: c.insured,
      branch: c.branch,
      reason: c.reason,
      claimHistory: c.claim_history,
      receivedAt: c.received_at,
      quarter: c.quarter,
      year: c.year,
      attachmentUrl: c.attachment_url,
      collaboratorName: collaborator?.name ?? "—",
      areaName: (collaborator && areaNameMap.get(collaborator.area_id)) ?? "—",
      finalMedal,
      evaluations: evals
        .sort((a: any, b: any) => (a.created_at > b.created_at ? 1 : -1))
        .map((e: any) => ({
          directorName: directorMap.get(e.director_id)?.name ?? "—",
          isCentral: isCentral(directorMap.get(e.director_id)?.role ?? ""),
          medal: e.medal as MedalType,
          justification: e.justification,
          comment: e.comment,
        })),
    };
  });

  return { compliments, areaNames: myAreas.map((a: any) => a.name as string) };
}

export default async function MinhaEquipePage() {
  const session = await requireRole("DIRECTOR", "DIRETOR_CENTRAL");
  const { compliments, areaNames } = await getMyTeamEvaluatedCompliments(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha Equipe</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {areaNames.length > 0
            ? `${compliments.length} elogio${compliments.length !== 1 ? "s" : ""} avaliado${compliments.length !== 1 ? "s" : ""} de ${areaNames.join(", ")}, classificado${compliments.length !== 1 ? "s" : ""} pelos demais diretores`
            : "Você não é diretor responsável por nenhuma área no momento"}
        </p>
      </div>
      <MyTeamEvaluatedList compliments={compliments as any} />
    </div>
  );
}
