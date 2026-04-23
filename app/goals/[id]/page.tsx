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
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", data);
    if (res.ok) {
      setGoal(data);
    }
    setLoading(false);
  } catch (error) {
    console.error("Erreur fetchGoal:", error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Objectif introuvable</p>
          <Link href="/goals" className="text-purple-600 hover:underline text-sm">
            ← Retour aux objectifs
          </Link>
        </div>
      </div>
    );
  }

  const totalTasks = goal.subGoals.reduce((acc, sg) => acc + sg.tasks.length, 0);
  const completedTasks = goal.subGoals.reduce(
    (acc, sg) => acc + sg.tasks.filter((t) => t.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/goals" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Mes objectifs
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900 truncate max-w-xs">
              {goal.title}
            </span>
          </div>
          <Link
            href={`/goals/${id}/edit`}
            className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Modifier
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {congratulations && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <p className="font-medium">{congratulations}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900">{goal.title}</h1>
              {goal.description && (
                <p className="text-gray-500 text-sm mt-2">{goal.description}</p>
              )}
            </div>
            <span className={`ml-4 text-sm px-3 py-1 rounded-full flex-shrink-0 ${
              goal.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : goal.status === "PAUSED"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-purple-100 text-purple-700"
            }`}>
              {goal.status === "ACTIVE" ? "Actif" : goal.status === "COMPLETED" ? "Terminé" : goal.status === "PAUSED" ? "Pausé" : "Annulé"}
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{completedTasks} / {totalTasks} tâches complétées</span>
              <span className="font-medium text-purple-600">{goal.progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4 text-xs text-gray-400">
            <span>Créé le {format(new Date(goal.createdAt), "d MMMM yyyy", { locale: fr })}</span>
            {goal.deadline && (
              <span>Échéance : {format(new Date(goal.deadline), "d MMMM yyyy", { locale: fr })}</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Sous-objectifs et tâches</h2>

          {goal.subGoals.map((subGoal) => {
            const subCompleted = subGoal.tasks.filter((t) => t.completed).length;
            const subTotal = subGoal.tasks.length;
            const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

            return (
              <div key={subGoal.id} className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      subProgress === 100 ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {subGoal.order}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{subGoal.title}</h3>
                      {subGoal.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{subGoal.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{subCompleted}/{subTotal}</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-1 mb-4">
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
                        task.completed ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          task.completed ? "line-through text-gray-400" : "text-gray-800"
                        }`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Planifié le {format(new Date(task.scheduledAt), "d MMM yyyy", { locale: fr })}
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