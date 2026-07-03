"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const areaFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(200),
  managerId: z.string().uuid("Gestor inválido").optional().or(z.literal("")),
  directorId: z.string().uuid("Diretor inválido").optional().or(z.literal("")),
});
type AreaFormData = z.infer<typeof areaFormSchema>;

interface Props {
  managers: { id: string; name: string }[];
  directors: { id: string; name: string }[];
  areaId?: string;
  defaultValues?: Partial<AreaFormData>;
}

export function AreaForm({ managers, directors, areaId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: defaultValues ?? { name: "", managerId: "", directorId: "" },
  });

  async function onSubmit(data: AreaFormData) {
    setLoading(true);
    try {
      const url = areaId ? `/api/areas/${areaId}` : "/api/areas";
      const method = areaId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          managerId: data.managerId || undefined,
          directorId: data.directorId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }
      toast.success(areaId ? "Área atualizada!" : "Área criada!");
      router.push("/areas");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Área *</Label>
            <Input id="name" placeholder="Ex: Automóvel, Vida, Comercial..." {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Gestor Responsável</Label>
            <Controller
              name="managerId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um gestor (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {managers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.managerId && <p className="text-xs text-destructive">{errors.managerId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Diretor Responsável</Label>
            <Controller
              name="directorId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione um diretor (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {directors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.directorId && <p className="text-xs text-destructive">{errors.directorId.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : areaId ? "Atualizar" : "Criar Área"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
