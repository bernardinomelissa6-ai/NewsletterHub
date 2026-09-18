import { requireAuth } from "@/lib/auth/session";
import { getCollaboratorRanking } from "@/services/ranking.service";
import { getManagerAreaIds } from "@/services/area.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CollaboratorRankingTable } from "@/components/rankings/CollaboratorRankingTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking de Colaboradores" };

export default async function CollaboratorsRankingPage() {
  const session = await requireAuth();
  const { role, id: userId } = session.user;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentQuarter = Math.ceil((now.getUTCMonth() + 1) / 3);

  const filter: { year: number; quarters: number[]; areaId?: string } = { year: currentYear, quarters: [currentQuarter] };

  if (role === "MANAGER") {
    const areaIds = await getManagerAreaIds(userId);
    if (areaIds.length > 0) filter.areaId = areaIds[0];
  }

  const ranking = await getCollaboratorRanking(filter);

  const areas = (role === "ADMIN" || role === "DIRECTOR")
    ? ((await supabaseAdmin.from("areas").select("id, name").order("name")).data ?? [])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking de Colaboradores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Classificação por medalhas conquistadas
        </p>
      </div>
      <CollaboratorRankingTable
        initialData={ranking}
        areas={areas}
        currentYear={currentYear}
        currentQuarter={currentQuarter}
        userRole={role}
      />
    </div>
  );
}
