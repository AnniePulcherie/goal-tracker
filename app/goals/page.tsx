"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Mes objectifs</span>
          </div>
          <Link
            href="/goals/new"
            className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Nouveau
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎯</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Aucun objectif
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 px-4">
              Crée ton premier objectif et laisse IA le décomposer en tâches journalières
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
            {activeGoals.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Actifs ({activeGoals.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} deleting={deleting} />
                  ))}
                </div>
              </div>
            )}
            {otherGoals.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Autres ({otherGoals.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {otherGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onDelete={deleteGoal} deleting={deleting} />
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
    (acc, sg) => acc + sg.tasks.filter((t) => t.completed).length, 0
  );

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">{goal.title}</h3>
          {goal.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          goal.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
          goal.status === "PAUSED" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
          goal.status === "CANCELLED" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
          "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
        }`}>
          {goal.status === "ACTIVE" ? "Actif" : goal.status === "COMPLETED" ? "Terminé" : goal.status === "PAUSED" ? "Pausé" : "Annulé"}
        </span>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
          <span>{completedTasks}/{totalTasks} tâches</span>
          <span>{goal.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-purple-600 h-1.5 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
        </div>
      </div>

      {goal.deadline && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
          Échéance : {format(new Date(goal.deadline), "d MMM yyyy", { locale: fr })}
        </p>
      )}

      <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
        <Link href={`/goals/${goal.id}`} className="flex-1 text-center text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
          Voir
        </Link>
        <Link href={`/goals/${goal.id}/edit`} className="flex-1 text-center text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Modifier
        </Link>
        <button
          onClick={() => onDelete(goal.id)}
          disabled={deleting === goal.id}
          className="flex-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
        >
          {deleting === goal.id ? "..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}