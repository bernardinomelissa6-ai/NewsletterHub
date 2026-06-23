import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getCollaboratorDashboard,
  getManagerDashboard,
  getDirectorDashboard,
  getAdminDashboard,
} from "@/services/dashboard.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;

  const { role, id } = session.user;

  try {
    let data;
    if (role === "ADMIN") data = await getAdminDashboard();
    else if (role === "DIRECTOR") data = await getDirectorDashboard(id);
    else if (role === "MANAGER") data = await getManagerDashboard(id);
    else data = await getCollaboratorDashboard(id, year, quarter);

    return NextResponse.json({ role, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
