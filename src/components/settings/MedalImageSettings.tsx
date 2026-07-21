"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash2, Medal as MedalIconLucide } from "lucide-react";
import { MedalIcon } from "@/components/ui/MedalIcon";
import type { MedalType } from "@/lib/supabase/types";

const MEDAL_LABELS: Record<MedalType, string> = {
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  SPECIAL: "Especial",
};

const MEDAL_ORDER: MedalType[] = ["BRONZE", "SILVER", "GOLD", "SPECIAL"];
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

async function uploadDirect(file: File): Promise<string> {
  const presignRes = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size, folder: "medals" }),
  });
  if (!presignRes.ok) {
    const err = await presignRes.json();
    throw new Error(err.error ?? "Erro ao preparar upload");
  }
  const { signedUrl, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!uploadRes.ok) throw new Error("Falha ao enviar imagem");

  return publicUrl;
}

export function MedalImageSettings({ medalImages }: { medalImages: Record<MedalType, string | null> }) {
  const [images, setImages] = useState(medalImages);
  const [busy, setBusy] = useState<MedalType | null>(null);

  async function handleUpload(type: MedalType, file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Use PNG, JPG, WEBP ou SVG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setBusy(type);
    try {
      const imageUrl = await uploadDirect(file);
      const res = await fetch("/api/settings/medal-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, imageUrl }),
      });
      if (!res.ok) { toast.error("Erro ao salvar imagem"); return; }
      setImages((prev) => ({ ...prev, [type]: imageUrl }));
      toast.success("Imagem da medalha atualizada!");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar imagem");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(type: MedalType) {
    setBusy(type);
    try {
      const res = await fetch("/api/settings/medal-images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) { toast.error("Erro ao remover imagem"); return; }
      setImages((prev) => ({ ...prev, [type]: null }));
      toast.success("Imagem removida — voltando ao ícone padrão");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {MEDAL_ORDER.map((type) => {
        const url = images[type];
        const isBusy = busy === type;
        return (
          <Card key={type} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MedalIconLucide className="w-4 h-4 text-muted-foreground" />
                Medalha {MEDAL_LABELS[type]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-lg border bg-muted/30 overflow-hidden">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={MEDAL_LABELS[type]} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <MedalIcon type={type} size={48} />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {url ? "Imagem personalizada em uso" : "Usando o ícone padrão do sistema"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={isBusy} className="gap-1.5" asChild>
                      <label className="cursor-pointer">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {url ? "Substituir" : "Enviar imagem"}
                        <input
                          type="file"
                          className="hidden"
                          accept={ACCEPTED_TYPES.join(",")}
                          disabled={isBusy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(type, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </Button>
                    {url && (
                      <Button variant="ghost" size="sm" disabled={isBusy} className="gap-1.5 text-destructive hover:text-destructive" onClick={() => handleRemove(type)}>
                        <Trash2 className="w-3.5 h-3.5" /> Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
