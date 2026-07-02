import { requireAuth } from "@/lib/auth/session";
import { getCollaboratorRanking } from "@/services/ranking.service";
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

  const filter: { year: number; quarter: number; areaId?: string } = { year: currentYear, quarter: currentQuarter };

  if (role === "MANAGER") {
    const { data: areas } = await supabaseAdmin.from("areas").select("id").eq("manager_id", userId);
    if (areas && areas.length > 0) filter.areaId = areas[0].id;
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
          Classificação por pontuação acumulada de medalhas
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
