import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserForm } from "@/components/users/UserForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Usuário" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const { data: user } = await supabaseAdmin.from("users").select("id, name, email, role, area_id").eq("id", id).single();
  if (!user) notFound();

  const { data: areas } = await supabaseAdmin.from("areas").select("id, name").order("name");

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Usuário</h1>
        <p className="text-muted-foreground text-sm mt-1">{user.name}</p>
      </div>
      <UserForm
        areas={areas ?? []}
        userId={user.id}
        defaultValues={{ name: user.name, email: user.email, role: user.role, areaId: user.area_id ?? "" }}
      />
    </div>
  );
}
