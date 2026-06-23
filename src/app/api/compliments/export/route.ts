import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;
  const exportFormat = searchParams.get("format") ?? "csv";

  const where: Record<string, unknown> = {};
  if (year) where.year = year;
  if (quarter) where.quarter = quarter;

  const compliments = await prisma.compliment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      collaborator: { select: { name: true, area: { select: { name: true } } } },
      evaluations: { select: { medal: true } },
    },
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDENTE_APROVACAO: "Pend. Aprovação",
    PENDENTE_AVALIACAO: "Pend. Avaliação",
    REJEITADO: "Rejeitado",
    DEVOLVIDO_PARA_AJUSTE: "Devolvido",
    AVALIADO: "Avaliado",
  };

  if (exportFormat === "csv") {
    const header = "ID,Segurado,Colaborador,Área,Ramo,Data Recebimento,Trimestre,Ano,Status,Medalha,Data Criação\n";
    const rows = compliments.map((c) => {
      const medal = c.evaluations[0]?.medal ?? "";
      return [
        c.id,
        `"${c.insured}"`,
        `"${c.collaborator.name}"`,
        `"${c.collaborator.area?.name ?? ""}"`,
        `"${c.branch}"`,
        format(c.receivedAt, "dd/MM/yyyy", { locale: ptBR }),
        `T${c.quarter}`,
        c.year,
        STATUS_LABELS[c.status] ?? c.status,
        medal,
        format(c.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ].join(",");
    }).join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="elogios-${year ?? "todos"}${quarter ? `-T${quarter}` : ""}.csv"`,
      },
    });
  }

  // JSON fallback
  return NextResponse.json(compliments);
}
