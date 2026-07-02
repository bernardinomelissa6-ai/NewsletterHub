import { requireRole } from "@/lib/auth/session";
import { getPendingApprovals } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingApprovalList } from "@/components/compliments/PendingApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aprovação de Elogios" };

async function getAdminPendingApprovals() {
  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, received_at, branch, reason, status, quarter, year, created_at, attachment_url, collaborator_id")
    .eq("status", "PENDENTE_APROVACAO")
    .order("created_at");

  if (!rawCompliments || rawCompliments.length === 0) return [];

  const collIds = [...new Set(rawCompliments.map((c) => c.collaborator_id).filter(Boolean))];
  const { data: collData } = await supabaseAdmin
    .from("users")
    .select("id, name, area_id, area:areas(name)")
    .in("id", collIds);

  const collMap = new Map((collData ?? []).map((u: any) => [u.id, u]));

  return rawCompliments.map((c) => ({
    ...c,
    collaborator: collMap.get(c.collaborator_id) ?? { id: c.collaborator_id, name: "Desconhecido", area: null },
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
