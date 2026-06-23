import { requireRole } from "@/lib/auth/session";
import { getPendingApprovals } from "@/services/compliment.service";
import { prisma } from "@/lib/db/prisma";
import { PendingApprovalList } from "@/components/compliments/PendingApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aprovação de Elogios" };

export default async function PendingApprovalPage() {
  const session = await requireRole("MANAGER", "ADMIN");

  const compliments = session.user.role === "ADMIN"
    ? await prisma.compliment.findMany({
        where: { status: "PENDENTE_APROVACAO" },
        orderBy: { createdAt: "asc" },
        include: {
          collaborator: { select: { id: true, name: true, area: { select: { name: true } } } },
        },
      })
    : await getPendingApprovals(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprovação de Elogios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {compliments.length} elogio{compliments.length !== 1 ? "s" : ""} aguardando sua aprovação
        </p>
      </div>
      <PendingApprovalList compliments={compliments as any} />
    </div>
  );
}
