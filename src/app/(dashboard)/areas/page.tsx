import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AreaTable } from "@/components/areas/AreaTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Áreas" };

export default async function AreasPage() {
  await requireRole("ADMIN");

  const areas = await prisma.area.findMany({
    orderBy: { name: "asc" },
    include: {
      manager: { select: { id: true, name: true } },
      _count: { select: { collaborators: true } },
    },
  });

  const managers = await prisma.user.findMany({
    where: { role: { in: ["MANAGER", "ADMIN"] }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Áreas</h1>
          <p className="text-muted-foreground text-sm mt-1">{areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/areas/new"><Plus className="w-4 h-4" /> Nova Área</Link>
        </Button>
      </div>
      <AreaTable areas={areas as any} managers={managers} />
    </div>
  );
}
