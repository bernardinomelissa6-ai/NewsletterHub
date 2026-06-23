import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCollaboratorRanking } from "@/services/ranking.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;

  const ranking = await getCollaboratorRanking({ year, quarter });

  const header = "Posição,Colaborador,Área,Pontos,Especial,Ouro,Prata,Bronze,Total Elogios,Total Treinamentos\n";
  const rows = ranking.map((r, i) => [
    i + 1,
    `"${r.name}"`,
    `"${r.areaName ?? ""}"`,
    r.score,
    r.specialCount,
    r.goldCount,
    r.silverCount,
    r.bronzeCount,
    r.totalCompliments,
    r.totalTrainings,
  ].join(",")).join("\n");

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ranking${year ? `-${year}` : ""}${quarter ? `-T${quarter}` : ""}.csv"`,
    },
  });
}
