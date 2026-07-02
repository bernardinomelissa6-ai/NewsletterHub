import { requireRole } from "@/lib/auth/session";
import { getPendingApprovals } from "@/services/compliment.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PendingApprovalList } from "@/components/compliments/PendingApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aprovação de Elogios" };

async function getAdminPendingApprovals() {
  const { data: rawCompliments } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, received_at, branch, reason, status, quarter, year, created_at, attachment_url, collaborator_id, submitted_by_id")
    .eq("status", "PENDENTE_APROVACAO")
    .order("created_at");

  if (!rawCompliments || rawCompliments.length === 0) return [];

  const allUserIds = [...new Set([
    ...rawCompliments.map((c) => c.collaborator_id),
    ...rawCompliments.map((c) => c.submitted_by_id),
  ].filter(Boolean))];

  // Query users without FK join (area:areas(name) can break the whole query)
  const { data: usersRaw } = allUserIds.length > 0
    ? await supabaseAdmin.from("users").select("id, name, area_id").in("id", allUserIds)
    : { data: [] };

  // Resolve area names separately
  const areaIds = [...new Set((usersRaw ?? []).map((u: any) => u.area_id).filter(Boolean))];
  const { data: areasData } = areaIds.length > 0
    ? await supabaseAdmin.from("areas").select("id, name").in("id", areaIds)
    : { data: [] };
  const areaMap = new Map((areasData ?? []).map((a: any) => [a.id, a.name]));

  const userMap = new Map((usersRaw ?? []).map((u: any) => [u.id, {
    id: u.id, name: u.name,
    area: u.area_id ? { name: areaMap.get(u.area_id) ?? "" } : null,
  }]));

  // Audit log fallback for records with no collaborator_id and no submitted_by_id
  const orphanIds = rawCompliments.filter((c) => !c.collaborator_id && !c.submitted_by_id).map((c) => c.id);
  const { data: auditData } = orphanIds.length > 0
    ? await supabaseAdmin.from("audit_logs").select("entity_id, user_name").eq("action", "CREATE").eq("entity_type", "Compliment").in("entity_id", orphanIds)
    : { data: [] };
  const auditMap = new Map((auditData ?? []).map((a: any) => [a.entity_id, a.user_name]));

  return rawCompliments.map((c) => ({
    ...c,
    collaborator:
      userMap.get(c.collaborator_id) ??
      userMap.get(c.submitted_by_id) ??
      (auditMap.has(c.id) ? { id: null, name: auditMap.get(c.id)!, area: null } : { id: null, name: "—", area: null }),
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
