"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";

const QUARTERS = [
  { value: "1", label: "T1 (Jan-Mar)" },
  { value: "2", label: "T2 (Abr-Jun)" },
  { value: "3", label: "T3 (Jul-Set)" },
  { value: "4", label: "T4 (Out-Dez)" },
];
const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

interface ExportConfig {
  endpoint: string;
  label: string;
  icon: React.ElementType;
}

const EXPORTS: ExportConfig[] = [
  { endpoint: "/api/compliments/export", label: "Elogios", icon: FileText },
  { endpoint: "/api/trainings/export", label: "Treinamentos", icon: FileSpreadsheet },
  { endpoint: "/api/rankings/collaborators/export", label: "Ranking Colaboradores", icon: FileSpreadsheet },
];

export function ReportsPanel() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState("");
  const [format, setFormat] = useState("xlsx");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleExport(endpoint: string, label: string) {
    setLoadingKey(endpoint);
    try {
      const params = new URLSearchParams({ year, format });
      if (quarter) params.set("quarter", quarter);

      const res = await fetch(`${endpoint}?${params}`);
      if (!res.ok) { toast.error("Erro ao exportar"); return; }

      const blob = await res.blob();
      const ext = format === "pdf" ? "pdf" : format === "csv" ? "csv" : "xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.toLowerCase().replace(/\s+/g, "-")}-${year}${quarter ? `-T${quarter}` : ""}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Relatório exportado!");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filtros para Exportação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trimestre (opcional)</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger><SelectValue placeholder="Todo o ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todo o ano</SelectItem>
                  {QUARTERS.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Formato</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export buttons */}
      <div className="grid gap-4">
        {EXPORTS.map(({ endpoint, label, icon: Icon }) => (
          <Card key={endpoint} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      {year}{quarter ? ` • T${quarter}` : " • Ano completo"} • {format.toUpperCase()}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleExport(endpoint, label)}
                  disabled={!!loadingKey}
                >
                  {loadingKey === endpoint
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Exportando...</>
                    : <><Download className="w-4 h-4" /> Exportar</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
