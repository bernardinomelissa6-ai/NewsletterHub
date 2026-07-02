"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Award, Calendar, Paperclip, Clock } from "lucide-react";
import { MedalIcon } from "@/components/ui/MedalIcon";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import type { MedalType } from "@/lib/supabase/types";

interface Compliment {
  id: string;
  insured: string;
  branch: string;
  reason: string;
  received_at: string;
  quarter: number;
  year: number;
  status: string;
  final_medal: MedalType | null;
  attachment_url: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDENTE_APROVACAO: { label: "Aguardando Aprovação", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  PENDENTE_AVALIACAO: { label: "Em Avaliação", color: "bg-blue-50 text-blue-700 border-blue-200" },
  DEVOLVIDO_PARA_AJUSTE: { label: "Devolvido para Ajuste", color: "bg-orange-50 text-orange-700 border-orange-200" },
  REJEITADO: { label: "Não Aprovado", color: "bg-red-50 text-red-700 border-red-200" },
  AVALIADO: { label: "Avaliado", color: "bg-green-50 text-green-700 border-green-200" },
};

const MEDAL_BADGE_COLORS: Record<MedalType, string> = {
  SPECIAL: "bg-purple-100 text-purple-800 border-purple-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  BRONZE: "bg-orange-100 text-orange-800 border-orange-300",
};

export function MyComplimentsList({ compliments }: { compliments: Compliment[] }) {
  const [selected, setSelected] = useState<Compliment | null>(null);

  if (compliments.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Award className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-40" />
          <p className="font-medium">Nenhum elogio ainda</p>
          <p className="text-sm mt-1">Seus elogios e reconhecimentos aparecerão aqui.</p>
        </CardContent>
      </Card>
    );
  }

  const evaluated = compliments.filter((c) => c.status === "AVALIADO");
  const others = compliments.filter((c) => c.status !== "AVALIADO");

  return (
    <>
      {evaluated.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Reconhecimentos Recebidos
          </h2>
          {evaluated.map((c) => (
            <Card
              key={c.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelected(c)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {c.final_medal && (
                    <div className="shrink-0 mt-0.5">
                      <MedalIcon type={c.final_medal} size={48} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">{c.branch}</Badge>
                      <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                      {c.final_medal && (
                        <Badge variant="outline" className={MEDAL_BADGE_COLORS[c.final_medal]}>
                          {MEDAL_LABELS[c.final_medal]}
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-base">{c.insured}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Em Andamento
          </h2>
          {others.map((c) => {
            const statusInfo = STATUS_LABELS[c.status] ?? { label: c.status, color: "bg-gray-50 text-gray-600 border-gray-200" };
            return (
              <Card
                key={c.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer opacity-80"
                onClick={() => setSelected(c)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      <Clock className="w-8 h-8 text-muted-foreground opacity-40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">{c.branch}</Badge>
                        <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year}</span>
                        <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      <p className="font-semibold text-base">{c.insured}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.reason}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Elogio</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {selected.final_medal && (
                <div className="flex flex-col items-center py-4 gap-2 bg-muted/40 rounded-xl">
                  <MedalIcon type={selected.final_medal} size={80} />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Sua Classificação</p>
                    <p className={`text-lg font-bold mt-0.5 ${
                      selected.final_medal === "SPECIAL" ? "text-purple-700" :
                      selected.final_medal === "GOLD" ? "text-yellow-600" :
                      selected.final_medal === "SILVER" ? "text-gray-600" : "text-orange-700"
                    }`}>
                      {MEDAL_LABELS[selected.final_medal]}
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

              {!selected.final_medal && (
                <div className="pt-3 border-t">
                  <Badge variant="outline" className={(STATUS_LABELS[selected.status] ?? { color: "" }).color}>
                    {(STATUS_LABELS[selected.status] ?? { label: selected.status }).label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    A classificação aparecerá aqui após a avaliação ser concluída.
                  </p>
                </div>
              )}

              {selected.attachment_url && (
                <div className="pt-3 border-t">
                  <a
                    href={selected.attachment_url}
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
