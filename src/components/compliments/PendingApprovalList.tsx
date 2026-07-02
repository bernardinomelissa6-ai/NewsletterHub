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
import { Check, X, RotateCcw, User, Calendar, Tag, FileText, Loader2 } from "lucide-react";

interface Compliment {
  id: string;
  insured: string;
  received_at: string;
  branch: string;
  reason: string;
  attachment_url: string | null;
  quarter: number;
  year: number;
  collaborator: { id: string; name: string; area?: { name: string } | null };
}

type DialogType = "approve" | "reject" | "return" | null;

export function PendingApprovalList({ compliments }: { compliments: Compliment[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Compliment | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);

  function openDialog(compliment: Compliment, type: DialogType) {
    setSelected(compliment);
    setDialogType(type);
    setObservation("");
  }

  function closeDialog() {
    setSelected(null);
    setDialogType(null);
    setObservation("");
  }

  async function handleAction() {
    if (!selected || !dialogType) return;

    if ((dialogType === "reject" || dialogType === "return") && observation.trim().length < 10) {
      toast.error("Observação obrigatória (mínimo 10 caracteres)");
      return;
    }

    setLoading(true);
    try {
      const endpoint = dialogType === "approve" ? "approve" : dialogType === "reject" ? "reject" : "return";
      const res = await fetch(`/api/compliments/${selected.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observation: observation || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao processar"); return; }

      const labels = { approve: "aprovado", reject: "rejeitado", return: "devolvido para ajuste" };
      toast.success(`Elogio ${labels[dialogType]}!`);
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
      <div className="space-y-4">
        {compliments.map((c) => (
          <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="warning">{c.branch}</Badge>
                    <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                  </div>
                  <h3 className="font-semibold text-base">{c.insured}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.collaborator.name}</span>
                    {c.collaborator.area && <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {c.collaborator.area.name}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {c.attachment_url && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Anexo disponível</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => openDialog(c, "approve")}>
                    <Check className="w-3.5 h-3.5" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => openDialog(c, "return")}>
                    <RotateCcw className="w-3.5 h-3.5" /> Devolver
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 border-red-300 text-red-700 hover:bg-red-50" onClick={() => openDialog(c, "reject")}>
                    <X className="w-3.5 h-3.5" /> Rejeitar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "approve" && "Aprovar Elogio"}
              {dialogType === "reject" && "Rejeitar Elogio"}
              {dialogType === "return" && "Devolver para Ajuste"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">{selected.insured}</p>
                <p className="text-muted-foreground mt-1 line-clamp-3">{selected.reason}</p>
              </div>
              <div className="space-y-2">
                <Label>
                  {dialogType === "approve" ? "Observação (opcional)" : "Observação (obrigatória) *"}
                </Label>
                <Textarea
                  placeholder={
                    dialogType === "approve"
                      ? "Adicione uma observação se necessário..."
                      : "Informe o motivo detalhado..."
                  }
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={3}
                />
                {(dialogType === "reject" || dialogType === "return") && observation.length > 0 && observation.length < 10 && (
                  <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button
              onClick={handleAction}
              disabled={loading}
              className={
                dialogType === "approve" ? "bg-green-600 hover:bg-green-700" :
                dialogType === "reject" ? "bg-red-600 hover:bg-red-700" :
                "bg-orange-600 hover:bg-orange-700"
              }
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</> :
                dialogType === "approve" ? "Confirmar Aprovação" :
                dialogType === "reject" ? "Confirmar Rejeição" :
                "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
