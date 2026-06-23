"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Star, BookOpen, Trophy, Medal } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ROLE_LABELS } from "@/lib/utils/permissions";
import { MEDAL_LABELS } from "@/lib/utils/ranking";
import type { Role } from "@prisma/client";

interface Props {
  data: {
    users: { total: number; byRole: Record<string, number> };
    areas: number;
    compliments: { total: number; byStatus: Record<string, number> };
    trainings: number;
    medals: number;
    topCollaborators: Array<{ userId: string; name: string; score: number; specialCount: number; goldCount: number }>;
    topAreas: Array<{ areaId: string; areaName: string; totalScore: number; collaboratorCount: number }>;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE_APROVACAO: "#F59E0B",
  PENDENTE_AVALIACAO: "#8B5CF6",
  REJEITADO: "#EF4444",
  DEVOLVIDO_PARA_AJUSTE: "#F97316",
  AVALIADO: "#10B981",
};

const STATUS_LABELS: Record<string, string> = {
  PENDENTE_APROVACAO: "Pend. Aprovação",
  PENDENTE_AVALIACAO: "Pend. Avaliação",
  REJEITADO: "Rejeitados",
  DEVOLVIDO_PARA_AJUSTE: "Devolvidos",
  AVALIADO: "Avaliados",
};

export function AdminDashboard({ data }: Props) {
  const statusChartData = Object.entries(data.compliments.byStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    fill: STATUS_COLORS[status] ?? "#94A3B8",
  }));

  const roleChartData = Object.entries(data.users.byRole).map(([role, count]) => ({
    name: ROLE_LABELS[role as Role] ?? role,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral corporativa do sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Usuários Ativos", value: data.users.total, icon: Users, color: "text-blue-600", href: "/users" },
          { label: "Áreas", value: data.areas, icon: Building2, color: "text-green-600", href: "/areas" },
          { label: "Elogios", value: data.compliments.total, icon: Star, color: "text-yellow-600", href: "/compliments" },
          { label: "Treinamentos", value: data.trainings, icon: BookOpen, color: "text-indigo-600", href: "/trainings" },
          { label: "Medalhas", value: data.medals, icon: Medal, color: "text-purple-600", href: "/rankings/collaborators" },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  <span className="text-3xl font-bold">{kpi.value}</span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos elogios */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Elogios por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {statusChartData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usuários por papel */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Usuários por Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roleChartData} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#48086F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top colaboradores */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top 5 Colaboradores</CardTitle>
              <Link href="/rankings/collaborators" className="text-xs text-primary hover:underline">Ver todos →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topCollaborators.map((c, i) => (
              <div key={c.userId} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.specialCount > 0 && `${c.specialCount}🏆 `}
                    {c.goldCount > 0 && `${c.goldCount}🥇`}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">{c.score} pts</span>
              </div>
            ))}
            {data.topCollaborators.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Top áreas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Top 5 Áreas</CardTitle>
              <Link href="/rankings/areas" className="text-xs text-primary hover:underline">Ver todos →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topAreas.map((a, i) => (
              <div key={a.areaId} className="flex items-center gap-3">
                <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{a.areaName}</p>
                  <p className="text-xs text-muted-foreground">{a.collaboratorCount} colaborador{a.collaboratorCount !== 1 ? "es" : ""}</p>
                </div>
                <span className="text-sm font-bold text-primary">{a.totalScore} pts</span>
              </div>
            ))}
            {data.topAreas.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
