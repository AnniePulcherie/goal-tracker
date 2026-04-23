"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { format, differenceInDays, eachDayOfInterval, isSameDay } from "date-fns";
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
  subGoals: { tasks: { completed: boolean }[] }[];
}

interface ChallengeEntry {
  id: string;
  date: string;
  success: boolean;
}

interface Challenge {
  id: string;
  title: string;
  color: string;
  startDate: string;
  endDate: string;
  entries: ChallengeEntry[];
}

interface DashboardData {
  goals: Goal[];
  challenges: Challenge[];
  todayTasks: Task[];
  stats: {
    totalGoals: number;
    completedGoals: number;
    activeGoals: number;
    totalChallenges: number;
    completedChallenges: number;
    activeChallenges: number;
    todayTasks: number;
    todayCompleted: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [congratulations, setCongratulations] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function toggleTask(taskId: string, completed: boolean) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    const result = await res.json();

    if (completed && result.congratulations) {
      setCongratulations(result.congratulations);
      setTimeout(() => setCongratulations(null), 5000);
    }

    fetchDashboard();
  }

  async function toggleChallenge(challengeId: string, date: string, currentSuccess: boolean) {
    const res = await fetch(`/api/challenges/${challengeId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, success: !currentSuccess }),
    });
    const result = await res.json();

    if (!currentSuccess && result.congratulations) {
      setCongratulations(result.congratulations);
      setTimeout(() => setCongratulations(null), 5000);
    }

    fetchDashboard();
  }

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
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
            <div className="px-3 py-2"><NotificationButton /></div>
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
            <span className="text-xl flex-shrink-0">🎉</span>
            <p className="font-medium text-sm">{congratulations}</p>
          </div>
        )}

        {/* Date */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {format(new Date(), "EEEE d MMMM", { locale: fr })}
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">Tableau de bord unifié</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : data ? (
          <>
            {/* Stats unifiées */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Tâches aujourdhui</p>
                <p className="text-xl font-semibold text-gray-900">
                  {data.stats.todayCompleted}
                  <span className="text-sm text-gray-400 font-normal">/{data.stats.todayTasks}</span>
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Objectifs actifs</p>
                <p className="text-xl font-semibold text-purple-600">{data.stats.activeGoals}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Défis actifs</p>
                <p className="text-xl font-semibold text-orange-500">{data.stats.activeChallenges}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Complétés</p>
                <p className="text-xl font-semibold text-green-600">
                  {data.stats.completedGoals + data.stats.completedChallenges}
                </p>
              </div>
            </div>

            {/* Tâches du jour + Défis du jour */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Tâches du jour */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Tâches du jour</h2>
                  <Link href="/goals" className="text-xs text-purple-600 hover:underline">
                    Voir tout →
                  </Link>
                </div>

                {data.todayTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">Aucune tâche aujourdhui</p>
                    <Link href="/goals/new" className="text-purple-600 text-xs hover:underline mt-1 inline-block">
                      Créer un objectif →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.todayTasks.map((task) => (
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

              {/* Défis du jour */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Défis du jour</h2>
                  <Link href="/challenges" className="text-xs text-orange-500 hover:underline">
                    Voir tout →
                  </Link>
                </div>

                {data.challenges.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm">Aucun défi actif</p>
                    <Link href="/challenges/new" className="text-orange-500 text-xs hover:underline mt-1 inline-block">
                      Créer un défi →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.challenges.map((challenge) => {
                      const todayEntry = challenge.entries.find((e) =>
                        isSameDay(new Date(e.date), new Date())
                      );
                      const isSuccess = todayEntry?.success || false;

                      const allDays = eachDayOfInterval({
                        start: new Date(challenge.startDate),
                        end: new Date(challenge.endDate),
                      });
                      const totalDays = allDays.length;
                      const daysElapsed = Math.min(
                        differenceInDays(new Date(), new Date(challenge.startDate)) + 1,
                        totalDays
                      );

                      return (
                        <div
                          key={challenge.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                            style={{ backgroundColor: challenge.color }}
                          >
                            💪
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {challenge.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              Jour {daysElapsed}/{totalDays}
                            </p>
                          </div>
                          <button
                            onClick={() => toggleChallenge(challenge.id, today, isSuccess)}
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                              isSuccess
                                ? "text-white"
                                : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                            }`}
                            style={isSuccess ? { backgroundColor: challenge.color } : {}}
                          >
                            {isSuccess ? "✓" : "○"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Progression objectifs */}
            {data.goals.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-gray-900 text-sm">Progression des objectifs</h2>
                  <Link href="/goals/new" className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-100">
                    + Nouveau
                  </Link>
                </div>
                <div className="space-y-3">
                  {data.goals.map((goal) => (
                    <Link key={goal.id} href={`/goals/${goal.id}`}>
                      <div className="hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-800 truncate flex-1">{goal.title}</p>
                          <span className="text-xs text-purple-600 font-medium ml-2">{goal.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actions rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/goals/new" className="bg-purple-600 text-white p-4 rounded-xl text-center hover:bg-purple-700 transition-colors">
                <p className="text-xl mb-1">🎯</p>
                <p className="text-xs font-medium">Nouvel objectif</p>
              </Link>
              <Link href="/challenges/new" className="bg-orange-500 text-white p-4 rounded-xl text-center hover:bg-orange-600 transition-colors">
                <p className="text-xl mb-1">💪</p>
                <p className="text-xs font-medium">Nouveau défi</p>
              </Link>
              <Link href="/dashboard/stats" className="bg-blue-500 text-white p-4 rounded-xl text-center hover:bg-blue-600 transition-colors">
                <p className="text-xl mb-1">📊</p>
                <p className="text-xs font-medium">Statistiques</p>
              </Link>
              <Link href="/dashboard/calendar" className="bg-green-500 text-white p-4 rounded-xl text-center hover:bg-green-600 transition-colors">
                <p className="text-xl mb-1">📅</p>
                <p className="text-xs font-medium">Calendrier</p>
              </Link>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}