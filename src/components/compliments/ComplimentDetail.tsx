"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Edit, Paperclip, User, Calendar, Tag, Award, Trash2, FileText, ExternalLink, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EmailAttachmentPreview } from "./EmailAttachmentPreview";
import { MedalIcon } from "@/components/ui/MedalIcon";
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
const MEDALS: MedalType[] = ["BRONZE", "SILVER", "GOLD", "SPECIAL"];
const MEDAL_SCORE_COLORS: Record<MedalType, string> = {
  SPECIAL: "text-purple-700 bg-purple-100 border-purple-300",
  GOLD: "text-yellow-700 bg-yellow-100 border-yellow-300",
  SILVER: "text-gray-600 bg-gray-100 border-gray-300",
  BRONZE: "text-orange-700 bg-orange-100 border-orange-300",
};
const REEVALUATE_ROLES = ["DIRECTOR", "DIRETOR_CENTRAL", "ADMIN"];

function getAttachmentKind(url: string, type?: string | null, name?: string | null): "pdf" | "image" | "email" | "other" {
  const ext = (name ?? url).split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if ((type ?? "").startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (ext === "msg" || ext === "eml") return "email";
  return "other";
}

interface Props {
  compliment: {
    id: string;
    insured: string;
    receivedAt: Date | string;
    branch: string;
    reason: string;
    claimHistory: string;
    status: ComplimentStatus;
    attachmentUrl: string | null;
    attachmentName?: string | null;
    attachmentType?: string | null;
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
  const [reevaluateOpen, setReevaluateOpen] = useState(false);
  const [newMedal, setNewMedal] = useState<MedalType | "">("");
  const [reevalReason, setReevalReason] = useState("");
  const [reevalLoading, setReevalLoading] = useState(false);

  const canEdit = c.status === "DEVOLVIDO_PARA_AJUSTE" && (c.collaborator?.id === userId || userRole === "ADMIN");
  const isAdmin = userRole === "ADMIN";
  const canSeeAllEvaluations = userRole === "ADMIN" || userRole === "DIRETOR_CENTRAL";
  const visibleEvaluations = canSeeAllEvaluations
    ? c.evaluations
    : c.evaluations.filter((e) => e.director_id === userId);
  const myEvaluation = c.evaluations.find((e) => e.director_id === userId);
  const canReevaluate = REEVALUATE_ROLES.includes(userRole) && !!myEvaluation;

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

  function openReevaluate() {
    setNewMedal(myEvaluation?.medal ?? "");
    setReevalReason("");
    setReevaluateOpen(true);
  }

  async function handleReevaluate() {
    if (!newMedal) { toast.error("Selecione uma medalha"); return; }
    if (reevalReason.trim().length < 10) { toast.error("Informe o motivo da alteração (mínimo 10 caracteres)"); return; }

    setReevalLoading(true);
    try {
      const res = await fetch(`/api/compliments/${c.id}/evaluate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medal: newMedal, reason: reevalReason }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao editar avaliação"); return; }
      toast.success("Avaliação atualizada com sucesso!");
      setReevaluateOpen(false);
      router.refresh();
    } finally {
      setReevalLoading(false);
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

          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Histórico do Sinistro</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{c.claimHistory}</p>
          </div>

          {c.attachmentUrl && (() => {
            const kind = getAttachmentKind(c.attachmentUrl, c.attachmentType, c.attachmentName);
            return (
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Anexo
                  </p>
                  <a
                    href={c.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir em nova aba
                  </a>
                </div>

                {kind === "pdf" && (
                  <iframe
                    src={c.attachmentUrl}
                    title="Pré-visualização do anexo"
                    className="w-full h-[520px] rounded-lg border"
                  />
                )}

                {kind === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.attachmentUrl}
                    alt={c.attachmentName ?? "Anexo"}
                    className="w-full max-h-[520px] object-contain rounded-lg border bg-muted/30"
                  />
                )}

                {kind === "email" && <EmailAttachmentPreview complimentId={c.id} />}

                {kind === "other" && (
                  <a
                    href={c.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border p-4 bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.attachmentName ?? "Anexo"}</p>
                      <p className="text-xs text-muted-foreground">Pré-visualização não disponível para este tipo de arquivo · clique para abrir</p>
                    </div>
                  </a>
                )}
              </div>
            );
          })()}
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
          <CardContent className="space-y-4">
            {visibleEvaluations.map((e, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{MEDAL_EMOJI[e.medal]}</span>
                    <span className="font-semibold text-lg">{MEDAL_LABELS[e.medal]}</span>
                  </div>
                  {canReevaluate && e.director_id === userId && (
                    <Button variant="outline" size="sm" onClick={openReevaluate} className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Button>
                  )}
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

      {/* Reevaluate medal dialog */}
      <Dialog open={reevaluateOpen} onOpenChange={setReevaluateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Avaliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <Label>Classificação / Medalha *</Label>
              <div className="flex flex-col gap-2">
                {MEDALS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewMedal(m)}
                    className={`flex items-center gap-4 px-4 py-2.5 rounded-lg border-2 font-medium transition-all text-left ${
                      newMedal === m ? MEDAL_SCORE_COLORS[m] + " border-current" : "border-border hover:bg-accent"
                    }`}
                  >
                    <MedalIcon type={m} size={64} />
                    <span className="text-base font-semibold">{MEDAL_LABELS[m]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivo da alteração *</Label>
              <Textarea
                placeholder="Explique o motivo da alteração da avaliação (mínimo 10 caracteres)..."
                value={reevalReason}
                onChange={(e) => setReevalReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReevaluateOpen(false)} disabled={reevalLoading}>Cancelar</Button>
            <Button onClick={handleReevaluate} disabled={reevalLoading || !newMedal}>
              {reevalLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar Alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
