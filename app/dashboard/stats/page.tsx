"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

interface Stats {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalTasks: number;
  completedTasks: number;
  todayTasks: number;
  todayCompleted: number;
  weekTasks: number;
  weekCompleted: number;
  monthTasks: number;
  monthCompleted: number;
  streak: number;
  last7Days: { date: string; total: number; completed: number }[];
  last4Weeks: { date: string; total: number; completed: number }[];
  goalsProgress: { title: string; progress: number; total: number; completed: number }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement des statistiques...</p>
      </div>
    );
  }

  if (!stats) return null;

  const globalRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const weekRate = stats.weekTasks > 0
    ? Math.round((stats.weekCompleted / stats.weekTasks) * 100)
    : 0;

  const monthRate = stats.monthTasks > 0
    ? Math.round((stats.monthCompleted / stats.monthTasks) * 100)
    : 0;

  const radialData = [
    { name: "Global", value: globalRate, fill: "#7c3aed" },
    { name: "Semaine", value: weekRate, fill: "#a78bfa" },
    { name: "Mois", value: monthRate, fill: "#ddd6fe" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">Statistiques</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Streak */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Série en cours</p>
              <p className="text-5xl font-bold mt-1">{stats.streak}</p>
              <p className="text-purple-200 text-sm mt-1">
                {stats.streak === 0
                  ? "Commence aujourd'hui !"
                  : stats.streak === 1
                  ? "jour consécutif"
                  : "jours consécutifs"}
              </p>
            </div>
            <div className="text-6xl">🔥</div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Objectifs actifs" value={stats.activeGoals} color="purple" />
          <StatCard label="Objectifs terminés" value={stats.completedGoals} color="green" />
          <StatCard
            label="Tâches aujourd'hui"
            value={`${stats.todayCompleted}/${stats.todayTasks}`}
            color="blue"
          />
          <StatCard
            label="Taux global"
            value={`${globalRate}%`}
            color="amber"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Graphique 7 derniers jours */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Tâches — 7 derniers jours
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Total" fill="#ddd6fe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Complétées" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique 4 dernières semaines */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Progression — 4 dernières semaines
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.last4Weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#ddd6fe"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  name="Complétées"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Taux de complétion */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Taux de complétion
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                innerRadius="30%"
                outerRadius="90%"
                data={radialData}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  label={{ position: "insideStart", fill: "#fff", fontSize: 11 }}
                  background
                  dataKey="value"
                />
                <Legend
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
                  )}
                />
                <Tooltip formatter={(value) => `${value}%`} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          {/* Progression des objectifs actifs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Objectifs actifs
            </h2>
            {stats.goalsProgress.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-400 text-sm">Aucun objectif actif</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.goalsProgress}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="progress" name="Progression" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Résumé semaine / mois */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-medium text-gray-900 mb-3">Cette semaine</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {stats.weekCompleted} / {stats.weekTasks} tâches
              </span>
              <span className="text-sm font-medium text-purple-600">{weekRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${weekRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-medium text-gray-900 mb-3">Ce mois</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                {stats.monthCompleted} / {stats.monthTasks} tâches
              </span>
              <span className="text-sm font-medium text-purple-600">{monthRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${monthRate}%` }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "purple" | "green" | "blue" | "amber";
}) {
  const colors = {
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${colors[color]}`}>{value}</p>
    </div>
  );
}