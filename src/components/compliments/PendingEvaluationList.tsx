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
import { Shield, User, Calendar, Loader2, CheckCircle2, Paperclip, Building2, ArrowLeft } from "lucide-react";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import { MedalIcon } from "@/components/ui/MedalIcon";
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
  attachment_url?: string | null;
  quarter: number;
  year: number;
  collaborator: { id: string | null; name: string; area?: { name: string } | null };
  approvals: Array<{ action: string; observation: string | null; manager: { name: string } }>;
  evaluations?: Evaluation[];
}

const MEDALS: MedalType[] = ["BRONZE", "SILVER", "GOLD", "SPECIAL"];

const MEDAL_SCORE_COLORS: Record<MedalType, string> = {
  SPECIAL: "text-purple-700 bg-purple-100 border-purple-300",
  GOLD: "text-yellow-700 bg-yellow-100 border-yellow-300",
  SILVER: "text-gray-600 bg-gray-100 border-gray-300",
  BRONZE: "text-orange-700 bg-orange-100 border-orange-300",
};

type Mode = "detail" | "evaluate";

interface Props {
  compliments: Compliment[];
  currentUserId: string;
  isCentralDirector: boolean;
}

export function PendingEvaluationList({ compliments, currentUserId, isCentralDirector }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Compliment | null>(null);
  const [mode, setMode] = useState<Mode>("detail");
  const [medal, setMedal] = useState<MedalType | "">("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  function openDetail(c: Compliment) {
    setSelected(c);
    setMode("detail");
    setMedal("");
    setComment("");
  }

  function closeDialog() {
    setSelected(null);
  }

  function startEvaluation() {
    setMode("evaluate");
    setMedal("");
    setComment("");
  }

  async function handleEvaluate() {
    if (!selected || !medal) { toast.error("Selecione uma medalha"); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/compliments/${selected.id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medal, justification: "", comment: comment || undefined }),
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
      <div className="space-y-3">
        {compliments.map((c) => {
          const evaluations = c.evaluations ?? [];
          const alreadyEvaluated = evaluations.some((e) => e.director_id === currentUserId);
          const evalCount = evaluations.length;

          return (
            <Card
              key={c.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openDetail(c)}
            >
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
                  {alreadyEvaluated && (
                    <span className="shrink-0 flex items-center gap-1 text-xs text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Avaliado
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {mode === "evaluate" && (
                <button
                  onClick={() => setMode("detail")}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              {mode === "detail" ? "Detalhes do Elogio" : "Avaliar Elogio"}
            </DialogTitle>
          </DialogHeader>

          {selected && mode === "detail" && (() => {
            const evaluations = selected.evaluations ?? [];
            const alreadyEvaluated = evaluations.some((e) => e.director_id === currentUserId);
            const approval = selected.approvals.find((a) => a.action === "APPROVED");
            return (
              <div className="space-y-4">
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
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Data</p>
                    <p>{format(new Date(selected.received_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trimestre / Ano</p>
                    <p>T{selected.quarter}/{selected.year}</p>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Elogio</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.reason}</p>
                </div>

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

                {approval && (
                  <div className="pt-3 border-t space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Aprovação</p>
                    <p className="text-sm text-green-700">✓ {approval.manager.name}{approval.observation ? `: "${approval.observation}"` : ""}</p>
                  </div>
                )}

                {evaluations.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avaliações ({evaluations.length}/3)</p>
                    {evaluations.map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span>{ev.director.role === "DIRETOR_CENTRAL" ? "Dir. Central" : ev.director.name}: <strong>{MEDAL_LABELS[ev.medal]}</strong></span>
                      </div>
                    ))}
                  </div>
                )}

                {!alreadyEvaluated && (
                  <div className="pt-3 border-t">
                    <Button className="w-full gap-2" onClick={startEvaluation}>
                      <Shield className="w-4 h-4" /> Avaliar este Elogio
                    </Button>
                    {isCentralDirector && (
                      <p className="text-xs text-purple-700 font-medium text-center mt-2">
                        Avaliação final — peso 50% (Diretor Central)
                      </p>
                    )}
                  </div>
                )}

                {alreadyEvaluated && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Você já avaliou este elogio.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {selected && mode === "evaluate" && (
            <>
              <div className="space-y-5">
                <div className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium">{selected.insured} → {selected.collaborator.name}</p>
                  <p className="text-muted-foreground mt-1">{selected.reason}</p>
                </div>

                <div className="space-y-3">
                  <Label>Classificação / Medalha *</Label>
                  <div className="flex flex-col gap-2">
                    {MEDALS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMedal(m)}
                        className={`flex items-center gap-4 px-4 py-2.5 rounded-lg border-2 font-medium transition-all text-left ${
                          medal === m ? MEDAL_SCORE_COLORS[m] + " border-current" : "border-border hover:bg-accent"
                        }`}
                      >
                        <MedalIcon type={m} size={64} />
                        <span className="text-base font-semibold">{MEDAL_LABELS[m]}</span>
                      </button>
                    ))}
                  </div>
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setMode("detail")}>Voltar</Button>
                <Button onClick={handleEvaluate} disabled={loading || !medal}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Avaliando...</> : "Confirmar Avaliação"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
