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
import { Shield, User, Calendar, Loader2, CheckCircle2 } from "lucide-react";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import type { MedalType } from "@/lib/supabase/types";

interface Evaluation {
  director_id: string;
  medal: MedalType;
  justification: string;
  director: { name: string; role?: string };
}

interface Compliment {
  id: string;
  insured: string;
  received_at: string;
  branch: string;
  reason: string;
  quarter: number;
  year: number;
  collaborator: { id: string; name: string; area?: { name: string } | null };
  approvals: Array<{ action: string; observation: string | null; manager: { name: string } }>;
  evaluations?: Evaluation[];
}

const MEDALS: MedalType[] = ["BRONZE", "SILVER", "GOLD", "SPECIAL"];
const MEDAL_EMOJI: Record<Exclude<MedalType, "SPECIAL">, string> = { GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" };

function EspecialMedalIcon() {
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center"
      style={{ background: "radial-gradient(circle at 35% 35%, #fde68a, #d97706)", boxShadow: "0 0 0 3px #b45309, inset 0 0 0 3px rgba(0,0,0,0.1)" }}>
      <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"
        style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)" }}>
        <span className="text-amber-200 text-base leading-none">★</span>
      </div>
    </div>
  );
}
const MEDAL_SCORE_COLORS: Record<MedalType, string> = {
  SPECIAL: "text-purple-700 bg-purple-100 border-purple-300",
  GOLD: "text-yellow-700 bg-yellow-100 border-yellow-300",
  SILVER: "text-gray-600 bg-gray-100 border-gray-300",
  BRONZE: "text-orange-700 bg-orange-100 border-orange-300",
};

interface Props {
  compliments: Compliment[];
  currentUserId: string;
  isCentralDirector: boolean;
}

export function PendingEvaluationList({ compliments, currentUserId, isCentralDirector }: Props) {
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
      toast.success("Avaliação registrada com sucesso!");
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
          const evaluations = c.evaluations ?? [];
          const alreadyEvaluated = evaluations.some((e) => e.director_id === currentUserId);
          const evalCount = evaluations.length;

          return (
            <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">{c.branch}</Badge>
                      <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                      <Badge
                        variant="outline"
                        className={evalCount >= 3 ? "text-green-700 border-green-300 bg-green-50" : "text-orange-700 border-orange-300 bg-orange-50"}
                      >
                        {evalCount}/3 avaliações
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base">{c.insured}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {c.collaborator.name}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {approval?.observation && (
                        <span className="text-green-700">✓ {approval.manager.name}: "{approval.observation}"</span>
                      )}
                    </div>
                    {evaluations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {evaluations.map((ev, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted border flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            {ev.director.role === "DIRETOR_CENTRAL" ? "Dir. Central" : ev.director.name}: {MEDAL_LABELS[ev.medal]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {alreadyEvaluated ? (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Avaliado
                    </span>
                  ) : (
                    <Button size="sm" onClick={() => openDialog(c)} className="shrink-0 gap-1">
                      <Shield className="w-3.5 h-3.5" /> Avaliar
                    </Button>
                  )}
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
                {isCentralDirector && (
                  <p className="mt-2 text-xs text-purple-700 font-medium">
                    Avaliação final — peso 50% (Diretor Central).
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Classificação / Medalha *</Label>
                <div className="flex flex-col gap-2">
                  {MEDALS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMedal(m)}
                      className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                        medal === m ? MEDAL_SCORE_COLORS[m] + " border-current" : "border-border hover:bg-accent"
                      }`}
                    >
                      {m === "SPECIAL" ? (
                        <EspecialMedalIcon />
                      ) : (
                        <span className="text-4xl leading-none">{MEDAL_EMOJI[m as Exclude<MedalType, "SPECIAL">]}</span>
                      )}
                      <span className="text-base font-semibold">{MEDAL_LABELS[m]}</span>
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
