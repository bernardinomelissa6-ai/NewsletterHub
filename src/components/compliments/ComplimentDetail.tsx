"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Paperclip, User, Calendar, Tag, Award, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MedalType, ComplimentStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<ComplimentStatus, string> = {
  PENDENTE_APROVACAO: "Pendente de Aprovação",
  PENDENTE_AVALIACAO: "Pendente de Avaliação",
  REJEITADO: "Rejeitado",
  DEVOLVIDO_PARA_AJUSTE: "Devolvido para Ajuste",
  AVALIADO: "Avaliado",
};

const STATUS_CLASSES: Record<ComplimentStatus, string> = {
  PENDENTE_APROVACAO: "status-pending",
  PENDENTE_AVALIACAO: "bg-red-100 text-red-800 border-red-200",
  REJEITADO: "status-rejected",
  DEVOLVIDO_PARA_AJUSTE: "status-returned",
  AVALIADO: "status-evaluated",
};

const MEDAL_LABELS: Record<MedalType, string> = { SPECIAL: "Especial", GOLD: "Ouro", SILVER: "Prata", BRONZE: "Bronze" };
const MEDAL_EMOJI: Record<MedalType, string> = { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" };

interface Props {
  compliment: {
    id: string;
    insured: string;
    receivedAt: Date | string;
    branch: string;
    reason: string;
    status: ComplimentStatus;
    attachmentUrl: string | null;
    quarter: number;
    year: number;
    createdAt: Date | string;
    collaborator: { id: string; name: string; area?: { name: string } | null } | null;
    approvals: Array<{ action: string; observation: string | null; createdAt: string; manager: { name: string } }>;
    evaluations: Array<{ director_id: string; medal: MedalType; justification: string; comment: string | null; createdAt: string; director: { name: string } }>;
  };
  userRole: string;
  userId: string;
}

export function ComplimentDetail({ compliment: c, userRole, userId }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit = c.status === "DEVOLVIDO_PARA_AJUSTE" && (c.collaborator?.id === userId || userRole === "ADMIN");
  const isAdmin = userRole === "ADMIN";
  const canSeeAllEvaluations = userRole === "ADMIN" || userRole === "DIRETOR_CENTRAL";
  const visibleEvaluations = canSeeAllEvaluations
    ? c.evaluations
    : c.evaluations.filter((e) => e.director_id === userId);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/compliments/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Elogio excluído com sucesso");
      router.push("/compliments");
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/compliments"><ArrowLeft className="w-4 h-4" /> Voltar</Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {canEdit && (
            <Button size="sm" asChild>
              <Link href={`/compliments/${c.id}/edit`}><Edit className="w-4 h-4" /> Editar</Link>
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          )}
        </div>
      </div>

      {/* Main card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-xl">{c.insured}</CardTitle>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[c.status]}`}>
              {STATUS_LABELS[c.status]}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{c.collaborator?.name ?? "—"}{c.collaborator?.area ? ` · ${c.collaborator.area.name}` : ""}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(String(c.receivedAt).substring(0, 10) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="w-4 h-4" />
              <span>{c.branch}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>T{c.quarter}/{c.year}</span>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Elogio</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.reason}</p>
          </div>

          {c.attachmentUrl && (
            <div className="pt-2 border-t">
              <a
                href={c.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Paperclip className="w-4 h-4" /> Ver Anexo
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approvals timeline */}
      {c.approvals.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Histórico de Aprovações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {c.approvals.map((a, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  a.action === "APPROVED" ? "bg-green-500" : a.action === "REJECTED" ? "bg-red-500" : "bg-orange-500"
                }`} />
                <div>
                  <p className="font-medium">{a.manager.name} · {a.action}</p>
                  {a.observation && <p className="text-muted-foreground mt-0.5">"{a.observation}"</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(a.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Evaluation */}
      {visibleEvaluations.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {canSeeAllEvaluations ? "Avaliações dos Diretores" : "Minha Avaliação"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visibleEvaluations.map((e, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{MEDAL_EMOJI[e.medal]}</span>
                  <span className="font-semibold text-lg">{MEDAL_LABELS[e.medal]}</span>
                </div>
                <p className="text-sm">{e.justification}</p>
                {e.comment && <p className="text-sm text-muted-foreground italic">"{e.comment}"</p>}
                <p className="text-xs text-muted-foreground">{e.director.name} · {format(new Date(e.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir elogio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o elogio de <span className="font-semibold text-foreground">{c.insured}</span>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
