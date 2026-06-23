import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getAuditLogs } from "@/services/audit.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search") ?? undefined;

  const result = await getAuditLogs({
    userId: searchParams.get("userId") ?? undefined,
    action: (searchParams.get("action") as any) ?? undefined,
    entityType: search ? undefined : (searchParams.get("entityType") ?? undefined),
    startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
    endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
    page: parseInt(searchParams.get("page") ?? "1"),
    limit: parseInt(searchParams.get("limit") ?? "30"),
    search,
  });

  return NextResponse.json(result);
}
