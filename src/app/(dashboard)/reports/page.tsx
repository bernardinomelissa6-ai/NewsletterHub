import { requireRole } from "@/lib/auth/session";
import { ReportsPanel } from "@/components/reports/ReportsPanel";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Relatórios" };

export default async function ReportsPage() {
  await requireRole("ADMIN", "DIRECTOR");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Exporte dados do sistema em Excel, CSV ou PDF
        </p>
      </div>
      <ReportsPanel />
    </div>
  );
}
