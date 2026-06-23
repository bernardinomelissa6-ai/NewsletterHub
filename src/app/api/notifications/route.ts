import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getNotifications, markAllAsRead } from "@/services/notification.service";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const onlyUnread = searchParams.get("unread") === "true";

  const notifications = await getNotifications(session.user.id, onlyUnread);
  return NextResponse.json(notifications);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  await markAllAsRead(session.user.id);
  return NextResponse.json({ message: "Notificações marcadas como lidas" });
}
