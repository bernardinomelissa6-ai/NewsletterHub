import { requireAuth } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NotificationList } from "@/components/notifications/NotificationList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const session = await requireAuth();

  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifs = notifications ?? [];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {notifs.filter((n) => !n.is_read).length} não lida{notifs.filter((n) => !n.is_read).length !== 1 ? "s" : ""}
        </p>
      </div>
      <NotificationList notifications={notifs as any} />
    </div>
  );
}
