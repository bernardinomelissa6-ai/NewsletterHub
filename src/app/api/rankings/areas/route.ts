import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAreaRanking } from "@/services/ranking.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarters = searchParams.getAll("quarter").map((q) => parseInt(q)).filter((q) => !isNaN(q));

  const ranking = await getAreaRanking({ year, quarters: quarters.length > 0 ? quarters : undefined });
  return NextResponse.json(ranking);
}
