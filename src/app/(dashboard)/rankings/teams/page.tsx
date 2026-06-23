import { requireRole } from "@/lib/auth/session";
import { getTeamRanking } from "@/services/ranking.service";
import { TeamRankingTable } from "@/components/rankings/TeamRankingTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ranking da Equipe" };

export default async function TeamRankingPage() {
  const session = await requireRole("MANAGER");
  const collaborators = await getTeamRanking(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ranking da Equipe</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Desempenho dos colaboradores da sua área
        </p>
      </div>
      <TeamRankingTable collaborators={collaborators} />
    </div>
  );
}
