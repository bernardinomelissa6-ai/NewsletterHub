import { requireRole } from "@/lib/auth/session";
import { getAreaRanking } from "@/services/ranking.service";
import { AreaRankingTable } from "@/components/rankings/AreaRankingTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking por Área" };

export default async function AreasRankingPage() {
  await requireRole("ADMIN", "DIRECTOR");

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const ranking = await getAreaRanking({ year: currentYear, quarter: currentQuarter });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking por Área</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Classificação das áreas por pontuação total da equipe
        </p>
      </div>
      <AreaRankingTable initialData={ranking} currentYear={currentYear} currentQuarter={currentQuarter} />
    </div>
  );
}
