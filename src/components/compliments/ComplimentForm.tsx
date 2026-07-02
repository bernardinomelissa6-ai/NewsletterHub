"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createComplimentSchema, type CreateComplimentInput } from "@/lib/validations/compliment.schema";
import { Loader2, Paperclip, X, Upload } from "lucide-react";

interface Branch {
  id: string;
  name: string;
}

interface Collaborator {
  id: string;
  name: string;
  area?: { name: string } | null;
}

interface Props {
  collaborators: Collaborator[];
  branches: Branch[];
  defaultCollaboratorName?: string;
  currentUserName?: string;
  complimentId?: string;
  defaultValues?: Partial<CreateComplimentInput>;
}

async function uploadDirect(file: File, folder: string): Promise<{ url: string; name: string; type: string }> {
  const presignRes = await fetch("/api/storage/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size, folder }),
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
  if (!uploadRes.ok) throw new Error("Falha ao enviar arquivo");

  return { url: publicUrl, name: file.name, type: file.type };
}

export function ComplimentForm({ collaborators, branches, defaultCollaboratorName, currentUserName, complimentId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const initialCollaboratorName = defaultCollaboratorName ?? collaborators[0]?.name ?? currentUserName ?? "";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateComplimentInput>({
    resolver: zodResolver(createComplimentSchema),
    defaultValues: {
      collaboratorId: initialCollaboratorName,
      ...defaultValues,
    },
  });

  async function onSubmit(data: CreateComplimentInput) {
    if (!file && !complimentId) { setFileError("Anexo obrigatório (PDF ou e-mail)"); return; }
    setFileError(null);
    setLoading(true);

    try {
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      let attachmentType: string | undefined;

      if (file) {
        setUploading(true);
        try {
          const uploaded = await uploadDirect(file, "compliments");
          attachmentUrl = uploaded.url;
          attachmentName = uploaded.name;
          attachmentType = uploaded.type;
        } catch (err: any) {
          toast.error(err.message ?? "Erro ao enviar arquivo");
          return;
        } finally {
          setUploading(false);
        }
      }

      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v as string));
      if (attachmentUrl) {
        formData.append("attachmentUrl", attachmentUrl);
        formData.append("attachmentName", attachmentName ?? file!.name);
        formData.append("attachmentType", attachmentType ?? file!.type);
      }

      const url = complimentId ? `/api/compliments/${complimentId}` : "/api/compliments";
      const method = complimentId ? "PUT" : "POST";

      const res = await fetch(url, { method, body: formData });
      const json = await res.json();

      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }

      toast.success(complimentId ? "Elogio atualizado!" : "Elogio registrado com sucesso!");
      router.push("/compliments");
      router.refresh();
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  const isWorking = loading || uploading;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="insured">Segurado / Cliente *</Label>
            <Input id="insured" placeholder="Nome do segurado, cliente ou parceiro" {...register("insured")} />
            {errors.insured && <p className="text-xs text-destructive">{errors.insured.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="receivedAt">Data de Recebimento *</Label>
              <Input id="receivedAt" type="date" max={new Date().toISOString().split("T")[0]} {...register("receivedAt")} />
              {errors.receivedAt && <p className="text-xs text-destructive">{errors.receivedAt.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Ramo *</Label>
              <Select onValueChange={(v) => setValue("branch", v)} defaultValue={defaultValues?.branch}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ramo" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.branch && <p className="text-xs text-destructive">{errors.branch.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Colaborador *</Label>
            {collaborators.length > 1 ? (
              <Select
                onValueChange={(v) => setValue("collaboratorId", v)}
                defaultValue={initialCollaboratorName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name} {c.area ? `(${c.area.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nome do colaborador"
                {...register("collaboratorId")}
              />
            )}
            {errors.collaboratorId && <p className="text-xs text-destructive">{errors.collaboratorId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Elogio *</Label>
            <Textarea
              id="reason"
              placeholder="Escreva o elogio recebido. Descreva o que foi reconhecido..."
              rows={5}
              {...register("reason")}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Anexo *</Label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center ${fileError ? "border-destructive" : "border-border"}`}>
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} disabled={isWorking}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Paperclip className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para anexar o e-mail ou PDF do elogio</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, EML, MSG • Máx. 1GB</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.eml,.msg,application/pdf,message/rfc822,application/vnd.ms-outlook"
                    onChange={(e) => { setFile(e.target.files?.[0] ?? null); setFileError(null); }}
                  />
                </label>
              )}
            </div>
            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={isWorking}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isWorking}>
              {uploading ? (
                <><Upload className="w-4 h-4 animate-pulse" /> Enviando arquivo...</>
              ) : loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : complimentId ? "Atualizar Elogio" : "Registrar Elogio"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
