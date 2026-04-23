"use client";

import { useState, useEffect } from "react";
import {signOut } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import NotificationButton from "@/components/NotificationButton";
import NotificationBadge from "@/components/NotificationBadge";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  deadline: string | null;
  createdAt: string;
  subGoals: { tasks: { completed: boolean }[] }[];
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchGoals() {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
    setLoading(false);
  }

  async function deleteGoal(id: string) {
    if (!confirm("Supprimer cet objectif et toutes ses tâches ?")) return;
    setDeleting(id);
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setDeleting(null);
  }

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const otherGoals = goals.filter((g) => g.status !== "ACTIVE");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">Mes objectifs</span>
            <Link
                href="/challenges"
                className="text-sm bg-orange-50 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors"
                >
                💪 Défis
            </Link>
          </div>
          <NotificationBadge />
          <NotificationButton />
          <Link
            href="/goals/new"
            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Nouvel objectif
          </Link>
          <Link
            href="/dashboard/stats"
            className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
            Statistiques
            </Link>

            <Link
                href="/dashboard/calendar"
                className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                Calendrier
            </Link>
            <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-gray-500 hover:text-gray-700"
                >
                Déconnexion
            </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun objectif pour linstant
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Crée ton premier objectif et laisse lIA le décomposer en tâches journalières
            </p>
            <Link
              href="/goals/new"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Créer mon premier objectif
            </Link>
          </div>
        ) : (
          <>
            {/* Objectifs actifs */}
            {activeGoals.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Objectifs actifs ({activeGoals.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {activeGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onDelete={deleteGoal}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Autres objectifs */}
            {otherGoals.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Autres objectifs ({otherGoals.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {otherGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onDelete={deleteGoal}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
  deleting,
}: {
  goal: Goal;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const totalTasks = goal.subGoals.reduce((acc, sg) => acc + sg.tasks.length, 0);
  const completedTasks = goal.subGoals.reduce(
    (acc, sg) => acc + sg.tasks.filter((t) => t.completed).length,
    0
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:border-purple-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{goal.title}</h3>
          {goal.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <span className={`ml-3 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          goal.status === "COMPLETED"
            ? "bg-green-100 text-green-700"
            : goal.status === "PAUSED"
            ? "bg-yellow-100 text-yellow-700"
            : goal.status === "CANCELLED"
            ? "bg-red-100 text-red-700"
            : "bg-purple-100 text-purple-700"
        }`}>
          {goal.status === "ACTIVE" ? "Actif" : goal.status === "COMPLETED" ? "Terminé" : goal.status === "PAUSED" ? "Pausé" : "Annulé"}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{completedTasks}/{totalTasks} tâches</span>
          <span>{goal.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-purple-600 h-1.5 rounded-full transition-all"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {goal.deadline && (
        <p className="text-xs text-gray-400 mb-3">
          Échéance : {format(new Date(goal.deadline), "d MMMM yyyy", { locale: fr })}
        </p>
      )}

      <div className="flex gap-2 pt-3 border-t border-gray-50">
        <Link
          href={`/goals/${goal.id}`}
          className="flex-1 text-center text-xs bg-purple-50 text-purple-600 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
        >
          Voir détails
        </Link>
        <Link
          href={`/goals/${goal.id}/edit`}
          className="flex-1 text-center text-xs bg-gray-50 text-gray-600 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Modifier
        </Link>
        <button
          onClick={() => onDelete(goal.id)}
          disabled={deleting === goal.id}
          className="flex-1 text-xs bg-red-50 text-red-500 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting === goal.id ? "..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}