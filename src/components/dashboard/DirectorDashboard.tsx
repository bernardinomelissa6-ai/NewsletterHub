"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Clock, ArrowRight, Star } from "lucide-react";

interface Props {
  data: {
    pendingEvaluation: number;
    totalCompliments: number;
    evaluated: number;
    approved: number;
  };
  userName: string;
}

export function DirectorDashboard({ data, userName }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard — Diretor</h1>
          <p className="text-muted-foreground text-sm mt-1">Olá, {userName.split(" ")[0]}! Gerencie as avaliações da sua área.</p>
        </div>
        <Button asChild>
          <Link href="/compliments/pending-evaluation">
            Avaliar Elogios <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-400">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-3xl font-bold text-purple-600">{data.pendingEvaluation}</span>
            </div>
            <p className="text-sm font-medium">Aguardando Avaliação</p>
            {data.pendingEvaluation > 0 && (
              <Link href="/compliments/pending-evaluation" className="text-xs text-primary hover:underline mt-1 block">
                Avaliar agora →
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
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
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{data.evaluated}</span>
            </div>
            <p className="text-sm font-medium">Avaliados</p>
          </CardContent>
        </Card>
      </div>

      {data.pendingEvaluation > 0 && (
        <Card className="border-0 shadow-sm bg-purple-50 dark:bg-purple-950 border-purple-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-800 dark:text-purple-200">
                Você tem {data.pendingEvaluation} elogio{data.pendingEvaluation > 1 ? "s" : ""} aguardando avaliação
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                Avalie e atribua medalhas para reconhecer seus colaboradores
              </p>
            </div>
            <Button asChild variant="brand" className="shrink-0">
              <Link href="/compliments/pending-evaluation">Avaliar agora</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
