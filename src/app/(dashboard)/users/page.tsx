import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UserTable } from "@/components/users/UserTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const session = await requireRole("ADMIN", "DIRETOR_CENTRAL");
  const isAdmin = session.user.role === "ADMIN";

  const [{ data: usersRaw }, { data: areas }] = await Promise.all([
    supabaseAdmin.from("users").select("id, name, email, role, is_active, area_id, created_at").order("name"),
    supabaseAdmin.from("areas").select("id, name").order("name"),
  ]);

  const areaMap = new Map((areas ?? []).map((a) => [a.id, a.name]));
  const users = (usersRaw ?? []).map((u) => ({
    ...u,
    isActive: u.is_active,
    area: u.area_id ? { name: areaMap.get(u.area_id) ?? "" } : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">{(users ?? []).length} usuário{(users ?? []).length !== 1 ? "s" : ""} cadastrado{(users ?? []).length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/users/new">
              <Plus className="w-4 h-4" /> Novo Usuário
            </Link>
          </Button>
        )}
      </div>
      <UserTable users={(users ?? []) as any} areas={areas ?? []} />
    </div>
  );
}
