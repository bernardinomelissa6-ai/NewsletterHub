import { requireRole } from "@/lib/auth/session";
import { getPendingEvaluations } from "@/services/compliment.service";
import { prisma } from "@/lib/db/prisma";
import { PendingEvaluationList } from "@/components/compliments/PendingEvaluationList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Avaliação de Elogios" };

export default async function PendingEvaluationPage() {
  const session = await requireRole("DIRECTOR", "ADMIN");

  // ADMIN sees all pending evaluations; DIRECTOR sees only their areas
  const compliments = session.user.role === "ADMIN"
    ? await prisma.compliment.findMany({
        where: { status: "PENDENTE_AVALIACAO" },
        orderBy: { createdAt: "asc" },
        include: {
          collaborator: { select: { id: true, name: true, area: { select: { name: true } } } },
          approvals: { orderBy: { createdAt: "desc" }, include: { manager: { select: { name: true } } } },
          evaluations: { include: { director: { select: { name: true } } } },
        },
      })
    : await getPendingEvaluations(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Avaliação de Elogios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {compliments.length} elogio{compliments.length !== 1 ? "s" : ""} aguardando avaliação e classificação de medalha
        </p>
      </div>
      <PendingEvaluationList compliments={compliments as any} />
    </div>
  );
}
