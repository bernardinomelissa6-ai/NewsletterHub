import { requireAuth } from "@/lib/auth/session";
import { getCollaboratorDashboard, getManagerDashboard, getDirectorDashboard, getAdminDashboard } from "@/services/dashboard.service";
import { CollaboratorDashboard } from "@/components/dashboard/CollaboratorDashboard";
import { ManagerDashboard } from "@/components/dashboard/ManagerDashboard";
import { DirectorDashboard } from "@/components/dashboard/DirectorDashboard";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireAuth();
  const { role, id } = session.user;
  const currentYear = new Date().getFullYear();

  if (role === "ADMIN") {
    const data = await getAdminDashboard();
    return <AdminDashboard data={data} />;
  }
  if (role === "DIRECTOR") {
    const data = await getDirectorDashboard(id);
    return <DirectorDashboard data={data} userName={session.user.name ?? ""} />;
  }
  if (role === "MANAGER") {
    const data = await getManagerDashboard(id);
    return <ManagerDashboard data={data} userName={session.user.name ?? ""} />;
  }

  const data = await getCollaboratorDashboard(id, currentYear);
  return <CollaboratorDashboard data={data} userName={session.user.name ?? ""} year={currentYear} />;
}
