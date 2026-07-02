import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyComplimentsList } from "@/components/compliments/MyComplimentsList";
import { calculateFinalMedal } from "@/lib/utils/medal-calculation";
import type { MedalType } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meus Reconhecimentos" };

const isCentral = (role: string) => ["DIRETOR_CENTRAL", "ADMIN"].includes(role);

async function getMyCompliments(userId: string) {
  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, branch, reason, received_at, quarter, year, status, attachment_url, created_at")
    .or(`collaborator_id.eq.${userId},submitted_by_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (!rawCompliments || rawCompliments.length === 0) return [];

  // For evaluated compliments, derive the final medal from evaluations table
  const evaluatedIds = rawCompliments.filter((c) => c.status === "AVALIADO").map((c) => c.id);

  if (evaluatedIds.length === 0) {
    return rawCompliments.map((c) => ({ ...c, final_medal: null as MedalType | null }));
  }

  const { data: evaluations } = await supabaseAdmin
    .from("compliment_evaluations")
    .select("compliment_id, medal, director_id")
    .in("compliment_id", evaluatedIds);

  const directorIds = [...new Set((evaluations ?? []).map((e: any) => e.director_id).filter(Boolean))];
  const { data: directors } = directorIds.length > 0
    ? await supabaseAdmin.from("users").select("id, role").in("id", directorIds)
    : { data: [] };

  const roleMap = new Map((directors ?? []).map((u: any) => [u.id, u.role]));

  const medalMap = new Map<string, MedalType>();
  for (const cid of evaluatedIds) {
    const evals = (evaluations ?? []).filter((e: any) => e.compliment_id === cid);
    try {
      const { finalMedal } = calculateFinalMedal(
        evals.map((e: any) => ({ medal: e.medal as MedalType, isCentralDirector: isCentral(roleMap.get(e.director_id) ?? "") }))
      );
      medalMap.set(cid, finalMedal);
    } catch {
      // Se não há avaliação central ainda, usa a primeira disponível
      if (evals.length > 0) medalMap.set(cid, evals[0].medal as MedalType);
    }
  }

  return rawCompliments.map((c) => ({ ...c, final_medal: medalMap.get(c.id) ?? null as MedalType | null }));
}

export default async function MeusElogiosPage() {
  const session = await requireRole("COLLABORATOR");
  const compliments = await getMyCompliments(session.user.id);

  const evaluated = compliments.filter((c) => c.status === "AVALIADO");
  const pending = compliments.filter((c) => c.status !== "AVALIADO");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Reconhecimentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {evaluated.length} elogio{evaluated.length !== 1 ? "s" : ""} avaliado{evaluated.length !== 1 ? "s" : ""}
          {pending.length > 0 && ` • ${pending.length} em andamento`}
        </p>
      </div>
      <MyComplimentsList compliments={compliments as any} />
    </div>
  );
}
