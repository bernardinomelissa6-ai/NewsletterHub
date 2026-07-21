"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Paperclip, Users, User, CheckCircle2 } from "lucide-react";
import { MedalIcon } from "@/components/ui/MedalIcon";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import type { MedalType } from "@/lib/supabase/types";

interface TeamEvaluation {
  directorName: string;
  isCentral: boolean;
  medal: MedalType;
  justification: string;
  comment: string | null;
}

interface TeamCompliment {
  id: string;
  insured: string;
  branch: string;
  reason: string;
  claimHistory: string;
  receivedAt: string;
  quarter: number;
  year: number;
  attachmentUrl: string | null;
  collaboratorName: string;
  areaName: string;
  finalMedal: MedalType | null;
  evaluations: TeamEvaluation[];
}

const MEDAL_BADGE_COLORS: Record<MedalType, string> = {
  SPECIAL: "bg-purple-100 text-purple-800 border-purple-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  BRONZE: "bg-orange-100 text-orange-800 border-orange-300",
};

export function MyTeamEvaluatedList({ compliments }: { compliments: TeamCompliment[] }) {
  const [selected, setSelected] = useState<TeamCompliment | null>(null);

  if (compliments.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum elogio avaliado ainda</p>
          <p className="text-sm mt-1">Os elogios da sua equipe aparecerão aqui assim que forem classificados pelos demais diretores.</p>
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
            onClick={() => setSelected(c)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {c.finalMedal && (
                  <div className="shrink-0 mt-0.5">
                    <MedalIcon type={c.finalMedal} size={48} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">{c.branch}</Badge>
                    <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                    {c.finalMedal && (
                      <Badge variant="outline" className={`${MEDAL_BADGE_COLORS[c.finalMedal]} font-semibold`}>
                        {MEDAL_LABELS[c.finalMedal]}
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-base">{c.insured}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> {c.collaboratorName} · {c.areaName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(c.receivedAt.substring(0, 10) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Elogio</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {selected.finalMedal && (
                <div className="flex flex-col items-center py-4 gap-2 bg-muted/40 rounded-xl">
                  <MedalIcon type={selected.finalMedal} size={80} />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Classificação Final</p>
                    <p className={`text-lg font-bold mt-0.5 ${
                      selected.finalMedal === "SPECIAL" ? "text-purple-700" :
                      selected.finalMedal === "GOLD" ? "text-yellow-600" :
                      selected.finalMedal === "SILVER" ? "text-gray-600" : "text-orange-700"
                    }`}>
                      {MEDAL_LABELS[selected.finalMedal]}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
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
                  <p>{format(new Date(selected.receivedAt.substring(0, 10) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trimestre / Ano</p>
                  <p>T{selected.quarter}/{selected.year}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Colaborador</p>
                  <p>{selected.collaboratorName} · {selected.areaName}</p>
                </div>
              </div>

              <div className="pt-3 border-t space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Elogio</p>
                <p className="text-sm whitespace-pre-wrap">{selected.reason}</p>
              </div>

              {selected.claimHistory && (
                <div className="pt-3 border-t space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Histórico do Sinistro</p>
                  <p className="text-sm whitespace-pre-wrap">{selected.claimHistory}</p>
                </div>
              )}

              {selected.evaluations.length > 0 && (
                <div className="pt-3 border-t space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Avaliações ({selected.evaluations.length})
                  </p>
                  {selected.evaluations.map((e, i) => (
                    <div key={i} className="space-y-1 rounded-lg border p-3 bg-muted/20">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          {e.directorName} {e.isCentral && <Badge variant="outline" className="ml-1 text-[10px]">Diretor Central</Badge>}
                        </span>
                        <span className="text-sm font-semibold">{MEDAL_LABELS[e.medal]}</span>
                      </div>
                      {e.justification && <p className="text-xs text-muted-foreground pl-5">{e.justification}</p>}
                      {e.comment && <p className="text-xs text-muted-foreground italic pl-5">"{e.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}

              {selected.attachmentUrl && (
                <div className="pt-3 border-t">
                  <a
                    href={selected.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Paperclip className="w-4 h-4" /> Ver Anexo
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
