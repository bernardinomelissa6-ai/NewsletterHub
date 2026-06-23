import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotificationList } from "@/components/notifications/NotificationList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const session = await requireAuth();

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {notifications.filter((n) => !n.isRead).length} não lida{notifications.filter((n) => !n.isRead).length !== 1 ? "s" : ""}
        </p>
      </div>
      <NotificationList notifications={notifications as any} />
    </div>
  );
}
