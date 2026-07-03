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

const userFormSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(200),
  email: z.string().email("Email inválido"),
  role: z.enum(["COLLABORATOR", "MANAGER", "DIRECTOR", "DIRETOR_CENTRAL", "ADMIN"]),
  areaId: z.string().uuid("Área inválida").optional().or(z.literal("")),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.role === "COLLABORATOR" && !data.areaId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Área é obrigatória para Colaboradores", path: ["areaId"] });
  }
});

type UserFormData = z.infer<typeof userFormSchema>;

const ROLES = [
  { value: "COLLABORATOR", label: "Colaborador" },
  { value: "MANAGER", label: "Gestor" },
  { value: "DIRECTOR", label: "Diretor" },
  { value: "DIRETOR_CENTRAL", label: "Diretor Central" },
  { value: "ADMIN", label: "Admin" },
];

interface Props {
  areas: { id: string; name: string }[];
  userId?: string;
  defaultValues?: Partial<UserFormData>;
}

export function UserForm({ areas, userId, defaultValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  });

  const role = watch("role");

  async function onSubmit(data: UserFormData) {
    setLoading(true);
    try {
      const url = userId ? `/api/users/${userId}` : "/api/users";
      const method = userId ? "PATCH" : "POST";
      const payload = { ...data, areaId: data.areaId || undefined, password: data.password || undefined };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }

      toast.success(userId ? "Usuário atualizado!" : "Usuário criado com sucesso!");
      router.push("/users");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" placeholder="João Silva" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" placeholder="joao@empresa.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Perfil *</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Selecione o perfil" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {(role === "COLLABORATOR" || role === "MANAGER") && (
            <div className="space-y-2">
              <Label>Área {role === "COLLABORATOR" ? "*" : "(opcional)"}</Label>
              <Controller
                name="areaId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                    <SelectContent>
                      {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.areaId && <p className="text-xs text-destructive">{errors.areaId.message}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{userId ? "Nova senha (opcional)" : "Senha *"}</Label>
            <Input id="password" type="password" placeholder={userId ? "Deixe em branco para manter" : "Mínimo 8 caracteres"} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : userId ? "Atualizar" : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
