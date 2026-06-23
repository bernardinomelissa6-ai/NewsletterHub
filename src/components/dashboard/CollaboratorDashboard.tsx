"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Trophy, BookOpen, TrendingUp, Medal } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { MEDAL_LABELS } from "@/lib/utils/ranking";

interface Props {
  data: {
    score: number;
    medals: { SPECIAL: number; GOLD: number; SILVER: number; BRONZE: number };
    compliments: { total: number; approved: number; rejected: number; pending: number; evaluated: number };
    trainings: { TRAINING: number; CONSULTANCY: number; COURSE: number };
    ranking: { position: number; total: number } | null;
  };
  userName: string;
  year: number;
}

const MEDAL_CHART_COLORS = ["#9B59B6", "#F59E0B", "#94A3B8", "#EA580C"];

export function CollaboratorDashboard({ data, userName, year }: Props) {
  const { score, medals, compliments, trainings, ranking } = data;

  const medalData = [
    { name: MEDAL_LABELS.SPECIAL, value: medals.SPECIAL, color: MEDAL_CHART_COLORS[0] },
    { name: MEDAL_LABELS.GOLD, value: medals.GOLD, color: MEDAL_CHART_COLORS[1] },
    { name: MEDAL_LABELS.SILVER, value: medals.SILVER, color: MEDAL_CHART_COLORS[2] },
    { name: MEDAL_LABELS.BRONZE, value: medals.BRONZE, color: MEDAL_CHART_COLORS[3] },
  ].filter((d) => d.value > 0);

  const trainingData = [
    { name: "Treinamentos", value: trainings.TRAINING },
    { name: "Cursos", value: trainings.COURSE },
    { name: "Consultorias", value: trainings.CONSULTANCY },
  ];

  const totalMedals = medals.SPECIAL + medals.GOLD + medals.SILVER + medals.BRONZE;
  const totalTrainings = trainings.TRAINING + trainings.COURSE + trainings.CONSULTANCY;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {userName.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">Sua performance em {year}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Trophy className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">{score}</span>
            </div>
            <p className="text-sm font-medium">Pontuação Total</p>
            {ranking && (
              <p className="text-xs text-muted-foreground mt-1">#{ranking.position} de {ranking.total}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold">{compliments.total}</span>
            </div>
            <p className="text-sm font-medium">Elogios</p>
            <p className="text-xs text-muted-foreground mt-1">{compliments.evaluated} avaliados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Medal className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold">{totalMedals}</span>
            </div>
            <p className="text-sm font-medium">Medalhas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {medals.SPECIAL > 0 && `${medals.SPECIAL}🏆 `}
              {medals.GOLD > 0 && `${medals.GOLD}🥇 `}
              {medals.SILVER > 0 && `${medals.SILVER}🥈 `}
              {medals.BRONZE > 0 && `${medals.BRONZE}🥉`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">{totalTrainings}</span>
            </div>
            <p className="text-sm font-medium">Treinamentos</p>
            <p className="text-xs text-muted-foreground mt-1">{trainings.COURSE} cursos • {trainings.CONSULTANCY} consultorias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treinamentos por tipo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Desenvolvimento Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trainingData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#48086F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Medalhas */}
        {medalData.length > 0 ? (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Distribuição de Medalhas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={medalData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {medalData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Nenhuma medalha em {year} ainda.</p>
              <p className="text-xs mt-1">Registre elogios recebidos para ganhar medalhas!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Elogios por status */}
      {compliments.total > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status dos Elogios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Pendentes", value: compliments.pending, color: "text-yellow-600", bg: "bg-yellow-50" },
                { label: "Avaliados", value: compliments.evaluated, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Aprovados", value: compliments.approved, color: "text-green-600", bg: "bg-green-50" },
                { label: "Rejeitados", value: compliments.rejected, color: "text-red-600", bg: "bg-red-50" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-lg p-4 text-center`}>
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
