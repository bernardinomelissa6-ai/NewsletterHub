import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DeadlineSettings } from "@/components/settings/DeadlineSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Controle de Prazos" };

export default async function DeadlinesPage() {
  await requireRole("ADMIN");

  const deadlines = await prisma.deadline.findMany({ orderBy: { type: "asc" } });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Controle de Prazos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure os prazos de cada etapa do fluxo de elogios
        </p>
      </div>
      <DeadlineSettings deadlines={deadlines as any} />
    </div>
  );
}
