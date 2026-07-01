import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCollaboratorRanking } from "@/services/ranking.service";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "DIRECTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
  const quarter = searchParams.get("quarter") ? parseInt(searchParams.get("quarter")!) : undefined;
  const exportFormat = searchParams.get("format") ?? "csv";

  const ranking = await getCollaboratorRanking({ year, quarter });

  const fileBase = `ranking${year ? `-${year}` : ""}${quarter ? `-T${quarter}` : ""}`;

  const headers = ["Posição", "Colaborador", "Área", "Pontos", "Especial 🏆", "Ouro 🥇", "Prata 🥈", "Bronze 🥉", "Total Elogios", "Total Treinamentos"];
  const rows = ranking.map((r, i) => [
    i + 1,
    r.name,
    r.areaName ?? "",
    r.score,
    r.specialCount,
    r.goldCount,
    r.silverCount,
    r.bronzeCount,
    r.totalCompliments,
    r.totalTrainings,
  ]);

  if (exportFormat === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Ranking");
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
    doc.text("Ranking de Colaboradores", 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${year ?? "Todos os anos"}${quarter ? ` | T${quarter}` : ""}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [["#", "Colaborador", "Área", "Pontos", "Especial", "Ouro", "Prata", "Bronze", "Elogios", "Treinamentos"]],
      body: rows,
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

