import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AreaTable } from "@/components/areas/AreaTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Áreas" };

export default async function AreasPage() {
  const session = await requireRole("ADMIN", "DIRETOR_CENTRAL");
  const isAdmin = session.user.role === "ADMIN";

  const { data: areasRaw } = await supabaseAdmin
    .from("areas")
    .select("*, manager:users!areas_manager_id_fkey(id, name), collaborators:users(id)")
    .order("name");

  const areas = (areasRaw ?? []).map((a) => ({
    ...a,
    _count: { collaborators: Array.isArray(a.collaborators) ? a.collaborators.length : 0 },
    collaborators: undefined,
  }));

  const { data: managers } = await supabaseAdmin
    .from("users")
    .select("id, name")
    .in("role", ["MANAGER", "ADMIN"])
    .eq("is_active", true)
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Áreas</h1>
          <p className="text-muted-foreground text-sm mt-1">{areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/areas/new"><Plus className="w-4 h-4" /> Nova Área</Link>
          </Button>
        )}
      </div>
      <AreaTable areas={areas as any} managers={managers ?? []} />
    </div>
  );
}
