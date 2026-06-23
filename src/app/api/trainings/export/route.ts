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

  const trainings = await prisma.training.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      collaborator: { select: { name: true, area: { select: { name: true } } } },
    },
  });

  const TYPE_LABELS: Record<string, string> = { TRAINING: "Treinamento", COURSE: "Curso", CONSULTANCY: "Consultoria" };

  if (exportFormat === "csv") {
    const header = "ID,Nome/Empresa,Colaborador,Área,Tipo,Ramo,Data,Trimestre,Ano\n";
    const rows = trainings.map((t) => [
      t.id,
      `"${t.insured}"`,
      `"${t.collaborator.name}"`,
      `"${t.collaborator.area?.name ?? ""}"`,
      TYPE_LABELS[t.type] ?? t.type,
      `"${t.branch}"`,
      format(t.date, "dd/MM/yyyy", { locale: ptBR }),
      `T${t.quarter}`,
      t.year,
    ].join(",")).join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="treinamentos-${year ?? "todos"}${quarter ? `-T${quarter}` : ""}.csv"`,
      },
    });
  }

  return NextResponse.json(trainings);
}
