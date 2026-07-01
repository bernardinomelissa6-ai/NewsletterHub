import { requireRole } from "@/lib/auth/session";
import { getPendingEvaluations } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingEvaluationList } from "@/components/compliments/PendingEvaluationList";
import type { Metadata } from "next";

const COMPLIMENT_SELECT = `id, insured, received_at, branch, reason, status, quarter, year, created_at, updated_at,
  collaborator:users!compliments_collaborator_id_fkey(id, name, area:areas(name)),
  approvals:compliment_approvals(id, action, observation, created_at, manager:users!compliment_approvals_manager_id_fkey(name)),
  evaluations:compliment_evaluations(id, medal, justification, director:users!compliment_evaluations_director_id_fkey(name))`;

export const metadata: Metadata = { title: "Avaliação de Elogios" };

export default async function PendingEvaluationPage() {
  const session = await requireRole("DIRECTOR", "ADMIN");

  const compliments = session.user.role === "ADMIN"
    ? ((await supabaseAdmin.from("compliments").select(COMPLIMENT_SELECT).eq("status", "PENDENTE_AVALIACAO").order("created_at")).data ?? [])
    : await getPendingEvaluations(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliação de Elogios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {compliments.length} elogio{compliments.length !== 1 ? "s" : ""} aguardando avaliação e classificação de medalha
        </p>
      </div>
      <PendingEvaluationList compliments={compliments as any} />
    </div>
  );
}
