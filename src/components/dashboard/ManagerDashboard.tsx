"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: {
    pendingApproval: number;
    totalCompliments: number;
    approved: number;
    rejected: number;
    evaluated: number;
  };
  userName: string;
}

export function ManagerDashboard({ data, userName }: Props) {
  const statusData = [
    { name: "Aprovados", value: data.approved },
    { name: "Avaliados", value: data.evaluated },
    { name: "Rejeitados", value: data.rejected },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard — Gestor</h1>
          <p className="text-muted-foreground text-sm mt-1">Olá, {userName.split(" ")[0]}! Aqui está o resumo da sua equipe.</p>
        </div>
        <Button asChild>
          <Link href="/compliments/pending-approval">
            Revisar Pendentes <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm border-l-4 border-l-yellow-400">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-3xl font-bold text-yellow-600">{data.pendingApproval}</span>
            </div>
            <p className="text-sm font-medium">Aguardando Aprovação</p>
            {data.pendingApproval > 0 && (
              <Link href="/compliments/pending-approval" className="text-xs text-primary hover:underline mt-1 block">
                Ver pendentes →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <span className="text-3xl font-bold">{data.totalCompliments}</span>
            </div>
            <p className="text-sm font-medium">Total de Elogios</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-3xl font-bold text-green-600">{data.approved}</span>
            </div>
            <p className="text-sm font-medium">Aprovados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-3xl font-bold text-red-600">{data.rejected}</span>
            </div>
            <p className="text-sm font-medium">Rejeitados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Status dos Elogios da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} barSize={50}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#48086F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
