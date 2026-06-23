import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCollaboratorRanking } from "@/services/ranking.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;
  const areaId = searchParams.get("areaId") ?? undefined;

  const filter: Record<string, unknown> = {};
  if (year) filter.year = year;
  if (quarter) filter.quarter = quarter;
  if (areaId && ["ADMIN", "DIRECTOR"].includes(session.user.role)) filter.areaId = areaId;
  else if (session.user.role === "MANAGER" && session.user.areaId) filter.areaId = session.user.areaId;

  const ranking = await getCollaboratorRanking(filter as any);
  return NextResponse.json(ranking);
}
