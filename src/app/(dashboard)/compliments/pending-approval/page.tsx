import { requireRole } from "@/lib/auth/session";
import { getPendingApprovals } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingApprovalList } from "@/components/compliments/PendingApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aprovação de Elogios" };

export default async function PendingApprovalPage() {
  const session = await requireRole("MANAGER", "ADMIN");

  const compliments = session.user.role === "ADMIN"
    ? ((await supabaseAdmin.from("compliments").select("id, insured, received_at, branch, reason, status, quarter, year, created_at, attachment_url, collaborator:users!collaborator_id(id, name, area:areas(name))").eq("status", "PENDENTE_APROVACAO").order("created_at")).data ?? [])
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
