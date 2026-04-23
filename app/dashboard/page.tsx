"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import NotificationButton from "@/components/NotificationButton";
import NotificationBadge from "@/components/NotificationBadge";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  scheduledAt: string;
  subGoal: {
    title: string;
    goal: { id: string; title: string };
  };
}

interface Goal {
  id: string;
  title: string;
  status: string;
  progress: number;
  deadline: string | null;
  subGoals: { tasks: { completed: boolean }[] }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const [congratulations, setCongratulations] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function fetchData() {
    setLoading(true);
    const [tasksRes, goalsRes] = await Promise.all([
      fetch(`/api/tasks?filter=${filter}`),
      fetch("/api/goals"),
    ]);
    const tasksData = await tasksRes.json();
    const goalsData = await goalsRes.json();
    setTasks(tasksData);
    setGoals(goalsData);
    setLoading(false);
  }

  async function toggleTask(taskId: string, completed: boolean) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    const data = await res.json();

    if (completed && data.congratulations) {
      setCongratulations(data.congratulations);
      setTimeout(() => setCongratulations(null), 5000);
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t))
    );
    fetchData();
  }

  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const activeGoals = goals.filter((g) => g.status === "ACTIVE").length;
  const completedGoals = goals.filter((g) => g.status === "COMPLETED").length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Desktop */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">🎯</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Goal Tracker</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-sm text-gray-500">Bonjour, {session?.user?.name} 👋</span>
            <NotificationBadge />
            <NotificationButton />
            <Link href="/challenges" className="text-sm bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
              💪 Défis
            </Link>
            <Link href="/dashboard/calendar" className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              Calendrier
            </Link>
            <Link href="/dashboard/stats" className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              Stats
            </Link>
            <Link href="/goals" className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
              Objectifs
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-500 hover:text-gray-700">
              Déconnexion
            </button>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationBadge />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600"></div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 mt-3 pt-3 pb-1 space-y-1">
            <p className="text-xs text-gray-400 px-2 mb-2">Bonjour, {session?.user?.name} 👋</p>
            <Link href="/goals" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">🎯 Mes objectifs</Link>
            <Link href="/challenges" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">💪 Mes défis</Link>
            <Link href="/dashboard/calendar" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">📅 Calendrier</Link>
            <Link href="/dashboard/stats" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">📊 Statistiques</Link>
            <div className="px-3 py-2">
              <NotificationButton />
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg">
              Déconnexion
            </button>
          </div>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Congratulations */}
        {congratulations && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <p className="font-medium text-sm">{congratulations}</p>
          </div>
        )}

        {/* Date */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">Tableau de bord</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-1">Tâches</p>
            <p className="text-xl font-semibold text-gray-900">
              {completedTasks}
              <span className="text-sm text-gray-400 font-normal">/{totalTasks}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-1">Actifs</p>
            <p className="text-xl font-semibold text-purple-600">{activeGoals}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-1">Terminés</p>
            <p className="text-xl font-semibold text-green-600">{completedGoals}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400 mb-1">Progression</p>
            <p className="text-xl font-semibold text-gray-900">
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {(["today", "week", "month"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                filter === f
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f === "today" ? "Aujourd'hui" : f === "week" ? "Semaine" : "Mois"}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Tasks */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">
              {filter === "today" ? "Tâches du jour" : filter === "week" ? "Tâches de la semaine" : "Tâches du mois"}
            </h2>

            {loading ? (
              <p className="text-gray-400 text-sm">Chargement...</p>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Aucune tâche</p>
                <Link href="/goals/new" className="text-purple-600 text-xs hover:underline mt-1 inline-block">
                  Créer un objectif →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      task.completed ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => toggleTask(task.id, e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {task.subGoal.goal.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goals */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">Objectifs</h2>
              <Link href="/goals/new" className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-100">
                + Nouveau
              </Link>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">Aucun objectif</p>
                <Link href="/goals/new" className="text-purple-600 text-xs hover:underline mt-1 inline-block">
                  Créer mon premier objectif →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 5).map((goal) => (
                  <Link key={goal.id} href={`/goals/${goal.id}`}>
                    <div className="p-3 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-800 truncate flex-1">{goal.title}</p>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          goal.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                          goal.status === "PAUSED" ? "bg-yellow-100 text-yellow-700" :
                          "bg-purple-100 text-purple-700"
                        }`}>
                          {goal.status === "ACTIVE" ? "Actif" : goal.status === "COMPLETED" ? "✓" : "Pausé"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{goal.progress}%</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}