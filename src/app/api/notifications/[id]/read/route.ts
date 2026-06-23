import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { markAsRead } from "@/services/notification.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await markAsRead(id, session.user.id);
  return NextResponse.json({ message: "Marcado como lido" });
}
