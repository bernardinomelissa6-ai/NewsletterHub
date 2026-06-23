import { requireAuth } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { RightPanel } from "@/components/layout/right-panel/RightPanel";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { countUnread } from "@/services/notification.service";
import type { Role } from "@prisma/client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const userRole = session.user.role as Role;
  const unreadCount = await countUnread(session.user.id);

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar userRole={userRole} unreadCount={unreadCount} />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="min-h-full p-6">
            {children}
          </div>
        </main>

        <RightPanel />
      </div>
    </SessionProvider>
  );
}
