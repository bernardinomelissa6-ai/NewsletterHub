"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, User, Calendar, Loader2 } from "lucide-react";
import { MEDAL_LABELS, MEDAL_POINTS } from "@/lib/utils/ranking";
import type { MedalType } from "@prisma/client";

interface Compliment {
  id: string;
  insured: string;
  receivedAt: string;
  branch: string;
  reason: string;
  quarter: number;
  year: number;
  collaborator: { id: string; name: string; area?: { name: string } | null };
  approvals: Array<{ action: string; observation: string | null; manager: { name: string } }>;
}

const MEDALS: MedalType[] = ["BRONZE", "SILVER", "GOLD", "SPECIAL"];
const MEDAL_EMOJI: Record<MedalType, string> = { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" };
const MEDAL_SCORE_COLORS: Record<MedalType, string> = {
  SPECIAL: "text-purple-700 bg-purple-100 border-purple-300",
  GOLD: "text-yellow-700 bg-yellow-100 border-yellow-300",
  SILVER: "text-gray-600 bg-gray-100 border-gray-300",
  BRONZE: "text-orange-700 bg-orange-100 border-orange-300",
};

export function PendingEvaluationList({ compliments }: { compliments: Compliment[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Compliment | null>(null);
  const [medal, setMedal] = useState<MedalType | "">("");
  const [justification, setJustification] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  function openDialog(compliment: Compliment) {
    setSelected(compliment);
    setMedal("");
    setJustification("");
    setComment("");
  }

  function closeDialog() {
    setSelected(null);
  }

  async function handleEvaluate() {
    if (!selected || !medal) { toast.error("Selecione uma medalha"); return; }
    if (justification.trim().length < 10) { toast.error("Justificativa obrigatória (mínimo 10 caracteres)"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/compliments/${selected.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medal, justification, comment: comment || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao avaliar"); return; }
      toast.success("Elogio avaliado com sucesso!");
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
          <Shield className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
          <p className="font-medium">Tudo avaliado!</p>
          <p className="text-sm mt-1">Não há elogios pendentes de avaliação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {compliments.map((c) => {
          const approval = c.approvals.find((a) => a.action === "APPROVED");
          return (
            <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">{c.branch}</Badge>
                      <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                    </div>
                    <h3 className="font-semibold text-base">{c.insured}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.collaborator.name}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(c.receivedAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {approval?.observation && (
                        <span className="text-green-700">✓ {approval.manager.name}: "{approval.observation}"</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openDialog(c)} className="shrink-0 gap-1">
                    <Shield className="w-3.5 h-3.5" /> Avaliar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Avaliar Elogio</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p className="font-medium">{selected.insured} → {selected.collaborator.name}</p>
                <p className="text-muted-foreground mt-1">{selected.reason}</p>
              </div>

              {/* Medal selection */}
              <div className="space-y-3">
                <Label>Classificação / Medalha *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {MEDALS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMedal(m)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        medal === m ? MEDAL_SCORE_COLORS[m] + " border-current" : "border-border hover:bg-accent"
                      }`}
                    >
                      <span className="text-lg">{MEDAL_EMOJI[m]}</span>
                      <p>{MEDAL_LABELS[m]}</p>
                      <p className="text-xs opacity-75">+{MEDAL_POINTS[m]} pts</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea
                  placeholder="Justifique a classificação atribuída..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
                {justification.length > 0 && justification.length < 10 && (
                  <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Comentário (opcional)</Label>
                <Textarea
                  placeholder="Adicione um comentário para o colaborador..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleEvaluate} disabled={loading || !medal}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Avaliando...</> : "Confirmar Avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
