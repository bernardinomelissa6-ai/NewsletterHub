import { requireAuth } from "@/lib/auth/session";
import { getCollaboratorRanking } from "@/services/ranking.service";
import { prisma } from "@/lib/db/prisma";
import { CollaboratorRankingTable } from "@/components/rankings/CollaboratorRankingTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking de Colaboradores" };

export default async function CollaboratorsRankingPage() {
  const session = await requireAuth();
  const { role, id: userId } = session.user;

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const filter: { year: number; quarter: number; areaId?: string } = { year: currentYear, quarter: currentQuarter };

  if (role === "MANAGER") {
    const areas = await prisma.area.findMany({ where: { managerId: userId }, select: { id: true } });
    if (areas.length > 0) filter.areaId = areas[0].id;
  }

  const ranking = await getCollaboratorRanking(filter);

  const areas = (role === "ADMIN" || role === "DIRECTOR")
    ? await prisma.area.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
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
