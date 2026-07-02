"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, X, RotateCcw, User, Calendar, Tag, FileText, Paperclip, Loader2, ArrowLeft, Building2, Clock } from "lucide-react";

interface Compliment {
  id: string;
  insured: string;
  received_at: string;
  branch: string;
  reason: string;
  attachment_url: string | null;
  quarter: number;
  year: number;
  collaborator: { id: string | null; name: string; area?: { name: string } | null };
}

type ActionMode = "detail" | "approve" | "reject" | "return";

export function PendingApprovalList({ compliments }: { compliments: Compliment[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Compliment | null>(null);
  const [mode, setMode] = useState<ActionMode>("detail");
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);

  function openDetail(c: Compliment) {
    setSelected(c);
    setMode("detail");
    setObservation("");
  }

  function closeDialog() {
    setSelected(null);
    setObservation("");
  }

  function startAction(action: "approve" | "reject" | "return") {
    setMode(action);
    setObservation("");
  }

  async function handleAction() {
    if (!selected || mode === "detail") return;

    if ((mode === "reject" || mode === "return") && observation.trim().length < 10) {
      toast.error("Observação obrigatória (mínimo 10 caracteres)");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "approve" ? "approve" : mode === "reject" ? "reject" : "return";
      const res = await fetch(`/api/compliments/${selected.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observation: observation || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao processar"); return; }

      const labels = { approve: "aprovado", reject: "rejeitado", return: "devolvido para ajuste" };
      toast.success(`Elogio ${labels[mode]}!`);
      closeDialog();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (compliments.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Check className="w-12 h-12 mx-auto mb-3 text-green-400 opacity-50" />
          <p className="font-medium">Tudo em dia!</p>
          <p className="text-sm mt-1">Não há elogios pendentes de aprovação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {compliments.map((c) => (
          <Card
            key={c.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openDetail(c)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="warning">{c.branch}</Badge>
                <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                {c.attachment_url && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="w-3 h-3" /> Anexo
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base">{c.insured}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {c.collaborator.name}
                </span>
                {c.collaborator.area && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {c.collaborator.area.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode !== "detail" && (
                <button
                  onClick={() => setMode("detail")}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {mode === "detail" && "Detalhes do Elogio"}
              {mode === "approve" && "Aprovar Elogio"}
              {mode === "reject" && "Rejeitar Elogio"}
              {mode === "return" && "Devolver para Ajuste"}
            </DialogTitle>
          </DialogHeader>

          {selected && mode === "detail" && (
            <div className="space-y-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Colaborador</p>
                  <p className="font-semibold">{selected.collaborator.name}</p>
                  {selected.collaborator.area && (
                    <p className="text-xs text-muted-foreground">{selected.collaborator.area.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Segurado / Cliente</p>
                  <p className="font-semibold">{selected.insured}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ramo</p>
                  <p>{selected.branch}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data de Recebimento</p>
                  <p>{format(new Date(selected.received_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trimestre / Ano</p>
                  <p>T{selected.quarter}/{selected.year}</p>
                </div>
              </div>

              {/* Reason */}
              <div className="pt-3 border-t space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Elogio</p>
                <p className="text-sm whitespace-pre-wrap">{selected.reason}</p>
              </div>

              {/* Attachment */}
              {selected.attachment_url && (
                <div className="pt-3 border-t">
                  <a
                    href={selected.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Paperclip className="w-4 h-4" /> Ver Anexo
                  </a>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-3 border-t flex flex-col gap-2">
                <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 w-full" onClick={() => startAction("approve")}>
                  <Check className="w-4 h-4" /> Aprovar Elogio
                </Button>
                <Button variant="outline" className="gap-2 w-full border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => startAction("return")}>
                  <RotateCcw className="w-4 h-4" /> Devolver para Ajuste
                </Button>
                <Button variant="outline" className="gap-2 w-full border-red-300 text-red-700 hover:bg-red-50" onClick={() => startAction("reject")}>
                  <X className="w-4 h-4" /> Rejeitar Elogio
                </Button>
              </div>
            </div>
          )}

          {selected && mode !== "detail" && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">{selected.insured}</p>
                <p className="text-muted-foreground mt-1 text-xs">Colaborador: {selected.collaborator.name}</p>
                <p className="text-muted-foreground mt-1 line-clamp-2">{selected.reason}</p>
              </div>
              <div className="space-y-2">
                <Label>
                  {mode === "approve" ? "Observação (opcional)" : "Observação (obrigatória) *"}
                </Label>
                <Textarea
                  placeholder={
                    mode === "approve"
                      ? "Adicione uma observação se necessário..."
                      : "Informe o motivo detalhado..."
                  }
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={3}
                />
                {(mode === "reject" || mode === "return") && observation.length > 0 && observation.length < 10 && (
                  <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
                )}
              </div>
            </div>
          )}

          {selected && mode !== "detail" && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode("detail")}>Voltar</Button>
              <Button
                onClick={handleAction}
                disabled={loading}
                className={
                  mode === "approve" ? "bg-green-600 hover:bg-green-700" :
                  mode === "reject" ? "bg-red-600 hover:bg-red-700" :
                  "bg-orange-600 hover:bg-orange-700"
                }
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> :
                  mode === "approve" ? "Confirmar Aprovação" :
                  mode === "reject" ? "Confirmar Rejeição" :
                  "Confirmar Devolução"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
