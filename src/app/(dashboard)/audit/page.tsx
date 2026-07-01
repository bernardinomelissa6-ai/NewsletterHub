import { requireRole } from "@/lib/auth/session";
import { getAuditLogs } from "@/services/audit.service";
import { AuditLogTable } from "@/components/audit/AuditLogTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Auditoria" };

export default async function AuditPage() {
  await requireRole("ADMIN");

  const result = await getAuditLogs({ page: 1, limit: 30 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trilha de Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro imutável de todas as ações realizadas no sistema
        </p>
      </div>
      <AuditLogTable initialData={result as any} />
    </div>
  );
}
