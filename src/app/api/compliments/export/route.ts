import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";

const STATUS_LABELS: Record<string, string> = {
  PENDENTE_APROVACAO: "Pend. Aprovação",
  PENDENTE_AVALIACAO: "Pend. Avaliação",
  REJEITADO: "Rejeitado",
  DEVOLVIDO_PARA_AJUSTE: "Devolvido",
  AVALIADO: "Avaliado",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;
  const exportFormat = searchParams.get("format") ?? "csv";

  let query = supabaseAdmin
    .from("compliments")
    .select("*, collaborator:users!compliments_collaborator_id_fkey(name, area:areas(name)), evaluations:compliment_evaluations(medal)")
    .order("created_at", { ascending: false });

  if (year) query = query.eq("year", year);
  if (quarter) query = query.eq("quarter", quarter);

  const { data: compliments } = await query;

  const fileBase = `elogios-${year ?? "todos"}${quarter ? `-T${quarter}` : ""}`;
  const allCompliments = compliments ?? [];

  const headers = ["ID", "Segurado", "Colaborador", "Área", "Ramo", "Data Recebimento", "Trimestre", "Ano", "Status", "Medalha", "Data Criação"];
  const rows = allCompliments.map((c: any) => [
    c.id,
    c.insured,
    c.collaborator?.name ?? "",
    c.collaborator?.area?.name ?? "",
    c.branch,
    format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR }),
    `T${c.quarter}`,
    c.year,
    STATUS_LABELS[c.status] ?? c.status,
    c.evaluations?.[0]?.medal ?? "",
    format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
  ]);

  if (exportFormat === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Elogios");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileBase}.xlsx"`,
      },
    });
  }

  if (exportFormat === "pdf") {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Relatório de Elogios", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${year ?? "Todos os anos"}${quarter ? ` | T${quarter}` : ""}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["Segurado", "Colaborador", "Área", "Ramo", "Data", "T", "Ano", "Status", "Medalha"]],
      body: allCompliments.map((c: any) => [
        c.insured,
        c.collaborator?.name ?? "",
        c.collaborator?.area?.name ?? "",
        c.branch,
        format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR }),
        `T${c.quarter}`,
        c.year,
        STATUS_LABELS[c.status] ?? c.status,
        c.evaluations?.[0]?.medal ?? "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [72, 8, 111] },
    });
    const buffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
      },
    });
  }

  // CSV (default)
  const csvHeader = headers.join(",") + "\n";
  const csvRows = rows.map((r) => r.map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : v)).join(",")).join("\n");
  return new NextResponse(csvHeader + csvRows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
    },
  });
}

