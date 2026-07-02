import { requireRole } from "@/lib/auth/session";
import { getPendingApprovals } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingApprovalList } from "@/components/compliments/PendingApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aprovação de Elogios" };

async function getAdminPendingApprovals() {
  const { data } = await supabaseAdmin
    .from("compliments")
    .select(`
      id, insured, received_at, branch, reason, status, quarter, year, created_at, attachment_url,
      collaborator:users!collaborator_id(id, name, area:areas(name)),
      submittedBy:users!submitted_by_id(id, name)
    `)
    .eq("status", "PENDENTE_APROVACAO")
    .order("created_at");

  return (data ?? []).map((c: any) => ({
    ...c,
    collaborator: c.collaborator ?? c.submittedBy ?? { id: null, name: "—", area: null },
  }));
}

export default async function PendingApprovalPage() {
  const session = await requireRole("MANAGER", "ADMIN", "DIRETOR_CENTRAL");

  const compliments = ["ADMIN", "DIRETOR_CENTRAL"].includes(session.user.role)
    ? await getAdminPendingApprovals()
    : await getPendingApprovals(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprovação de Elogios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {compliments.length} elogio{compliments.length !== 1 ? "s" : ""} aguardando sua aprovação
        </p>
      </div>
      <PendingApprovalList compliments={compliments as any} />
    </div>
  );
}
