"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  completed: boolean;
}

interface SubGoal {
  id: string;
  title: string;
  description: string | null;
  order: number;
  status: string;
  tasks: Task[];
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  deadline: string | null;
  createdAt: string;
  subGoals: SubGoal[];
}

export default function GoalDetailPage() {
  const { id } = useParams();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [congratulations, setCongratulations] = useState<string | null>(null);

  useEffect(() => {
    fetchGoal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchGoal() {
    try {
      const res = await fetch(`/api/goals/${id}`);
      const data = await res.json();
      if (res.ok) setGoal(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
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
    fetchGoal();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Objectif introuvable</p>
          <Link href="/goals" className="text-purple-600 dark:text-purple-400 hover:underline text-sm">
            ← Retour aux objectifs
          </Link>
        </div>
      </div>
    );
  }

  const totalTasks = goal.subGoals.reduce((acc, sg) => acc + sg.tasks.length, 0);
  const completedTasks = goal.subGoals.reduce(
    (acc, sg) => acc + sg.tasks.filter((t) => t.completed).length, 0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/goals" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex-shrink-0">
              ←
            </Link>
            <span className="text-gray-300 dark:text-gray-700 flex-shrink-0">|</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
              {goal.title}
            </span>
          </div>
          <Link
            href={`/goals/${id}/edit`}
            className="text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-2"
          >
            Modifier
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {congratulations && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🎉</span>
            <p className="font-medium text-sm">{congratulations}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{goal.title}</h1>
              {goal.description && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{goal.description}</p>
              )}
            </div>
            <span className={`ml-3 text-xs px-2 py-1 rounded-full flex-shrink-0 ${
              goal.status === "COMPLETED" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
              goal.status === "PAUSED" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
              "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
            }`}>
              {goal.status === "ACTIVE" ? "Actif" : goal.status === "COMPLETED" ? "Terminé" : "Pausé"}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
              <span>{completedTasks}/{totalTasks} tâches</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span>Créé le {format(new Date(goal.createdAt), "d MMM yyyy", { locale: fr })}</span>
            {goal.deadline && (
              <span>Échéance : {format(new Date(goal.deadline), "d MMM yyyy", { locale: fr })}</span>
            )}
          </div>
        </div>

        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Sous-objectifs et tâches
        </h2>

        <div className="space-y-3">
          {goal.subGoals.map((subGoal) => {
            const subCompleted = subGoal.tasks.filter((t) => t.completed).length;
            const subTotal = subGoal.tasks.length;
            const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

            return (
              <div key={subGoal.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      subProgress === 100
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                    }`}>
                      {subGoal.order}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{subGoal.title}</h3>
                      {subGoal.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{subGoal.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                    {subCompleted}/{subTotal}
                  </span>
                </div>

                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1 mb-3">
                  <div
                    className="bg-purple-400 h-1 rounded-full transition-all"
                    style={{ width: `${subProgress}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {subGoal.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                        task.completed
                          ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          task.completed
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-800 dark:text-gray-200"
                        }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{task.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {format(new Date(task.scheduledAt), "d MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                      {task.completed && (
                        <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}