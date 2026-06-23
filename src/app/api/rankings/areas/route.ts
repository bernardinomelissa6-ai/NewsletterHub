import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAreaRanking } from "@/services/ranking.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;

  const ranking = await getAreaRanking({ year, quarter });
  return NextResponse.json(ranking);
}
