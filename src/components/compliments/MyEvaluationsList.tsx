"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Paperclip, History } from "lucide-react";
import { MedalIcon } from "@/components/ui/MedalIcon";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import type { MedalType } from "@/lib/supabase/types";

interface EvaluatedCompliment {
  id: string;
  insured: string;
  branch: string;
  reason: string;
  received_at: string;
  quarter: number;
  year: number;
  status: string;
  attachment_url: string | null;
  collaborator_name: string | null;
  my_medal: MedalType;
  final_medal: MedalType | null;
  evaluated_at: string;
}

const MEDAL_BADGE_COLORS: Record<MedalType, string> = {
  SPECIAL: "bg-purple-100 text-purple-800 border-purple-300",
  GOLD: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SILVER: "bg-gray-100 text-gray-700 border-gray-300",
  BRONZE: "bg-orange-100 text-orange-800 border-orange-300",
};

export function MyEvaluationsList({ evaluations }: { evaluations: EvaluatedCompliment[] }) {
  const [selected, setSelected] = useState<EvaluatedCompliment | null>(null);

  if (evaluations.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhuma avaliação realizada ainda</p>
          <p className="text-sm mt-1">Os elogios que você avaliar aparecerão aqui.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {evaluations.map((e) => (
          <Card
            key={e.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelected(e)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <MedalIcon type={e.my_medal} size={48} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">{e.branch}</Badge>
                    <span className="text-xs text-muted-foreground">T{e.quarter}/{e.year}</span>
                    <Badge variant="outline" className={MEDAL_BADGE_COLORS[e.my_medal]}>
                      Minha nota: {MEDAL_LABELS[e.my_medal]}
                    </Badge>
                    {e.final_medal && (
                      <Badge variant="outline" className={`${MEDAL_BADGE_COLORS[e.final_medal]} font-semibold`}>
                        Final: {MEDAL_LABELS[e.final_medal]}
                      </Badge>
                    )}
                    {e.status !== "AVALIADO" && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Em avaliação
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-base">{e.insured}</p>
                  {e.collaborator_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{e.collaborator_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.reason}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(e.received_at), "dd/MM/yyyy", { locale: ptBR })}
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
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col items-center py-4 gap-2 bg-muted/40 rounded-xl">
                  <MedalIcon type={selected.my_medal} size={64} />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Minha Avaliação</p>
                    <p className={`text-base font-bold mt-0.5 ${
                      selected.my_medal === "SPECIAL" ? "text-purple-700" :
                      selected.my_medal === "GOLD" ? "text-yellow-600" :
                      selected.my_medal === "SILVER" ? "text-gray-600" : "text-orange-700"
                    }`}>
                      {MEDAL_LABELS[selected.my_medal]}
                    </p>
                  </div>
                </div>

                {selected.final_medal && (
                  <div className="flex-1 flex flex-col items-center py-4 gap-2 bg-green-50 rounded-xl">
                    <MedalIcon type={selected.final_medal} size={64} />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Resultado Final</p>
                      <p className={`text-base font-bold mt-0.5 ${
                        selected.final_medal === "SPECIAL" ? "text-purple-700" :
                        selected.final_medal === "GOLD" ? "text-yellow-600" :
                        selected.final_medal === "SILVER" ? "text-gray-600" : "text-orange-700"
                      }`}>
                        {MEDAL_LABELS[selected.final_medal]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
                {selected.collaborator_name && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Colaborador</p>
                    <p>{selected.collaborator_name}</p>
                  </div>
                )}
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
