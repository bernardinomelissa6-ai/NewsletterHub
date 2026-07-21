"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Mail, AlertTriangle } from "lucide-react";

interface ParsedEmail {
  subject: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  date: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
}

function formatEmailDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return format(parsed, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function EmailAttachmentPreview({ complimentId }: { complimentId: string }) {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/compliments/${complimentId}/attachment-preview`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro ao carregar pré-visualização");
        if (!cancelled) setEmail(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Erro ao carregar pré-visualização");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [complimentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border p-8 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando e-mail...
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground bg-muted/30">
        <AlertTriangle className="w-4 h-4 shrink-0 text-orange-500" />
        {error ?? "Não foi possível carregar a pré-visualização do e-mail."}
      </div>
    );
  }

  const formattedDate = formatEmailDate(email.date);

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="bg-muted/40 p-3 space-y-1 text-sm border-b">
        <div className="flex items-center gap-2 font-semibold">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
          <span>{email.subject || "(Sem assunto)"}</span>
        </div>
        <div className="text-xs text-muted-foreground pl-6 space-y-0.5">
          {email.from && <p><span className="font-medium">De:</span> {email.from}</p>}
          {email.to && <p><span className="font-medium">Para:</span> {email.to}</p>}
          {email.cc && <p><span className="font-medium">Cc:</span> {email.cc}</p>}
          {formattedDate && <p><span className="font-medium">Data:</span> {formattedDate}</p>}
        </div>
      </div>

      {email.bodyHtml ? (
        <iframe
          sandbox=""
          srcDoc={email.bodyHtml}
          title="Corpo do e-mail"
          className="w-full h-[420px] bg-white"
        />
      ) : email.bodyText ? (
        <p className="p-4 text-sm whitespace-pre-wrap max-h-[420px] overflow-y-auto">{email.bodyText}</p>
      ) : (
        <p className="p-4 text-sm text-muted-foreground">Este e-mail não possui conteúdo de corpo para exibir.</p>
      )}
    </div>
  );
}
