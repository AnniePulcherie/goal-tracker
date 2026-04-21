"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PendingTask {
  id: string;
  title: string;
  subGoal: {
    goal: { title: string };
  };
}

export default function NotificationBadge() {
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchPendingTasks();
  }, []);

  async function fetchPendingTasks() {
    const res = await fetch("/api/tasks?filter=today");
    const tasks = await res.json();
    const pending = tasks.filter((t: PendingTask & { completed: boolean }) => !t.completed);
    setPendingTasks(pending);
    if (pending.length > 0) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    }
  }

  return (
    <>
      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-2xl shadow-lg p-4 max-w-sm animate-bounce-once">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎯</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                {pendingTasks.length} tâche{pendingTasks.length > 1 ? "s" : ""} aujourdhui
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {pendingTasks[0]?.title}
                {pendingTasks.length > 1 && ` et ${pendingTasks.length - 1} autre${pendingTasks.length > 2 ? "s" : ""}...`}
              </p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Badge */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-lg">🔔</span>
          {pendingTasks.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {pendingTasks.length > 9 ? "9+" : pendingTasks.length}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">
                Tâches du jour
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pendingTasks.length === 0
                  ? "Tout est complété ! 🎉"
                  : `${pendingTasks.length} tâche${pendingTasks.length > 1 ? "s" : ""} en attente`}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {pendingTasks.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <span className="text-3xl">✅</span>
                  <p className="text-sm text-gray-500 mt-2">
                    Bravo ! Toutes tes tâches sont complétées !
                  </p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.subGoal.goal.title}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <Link
                href="/dashboard"
                onClick={() => setShowDropdown(false)}
                className="block text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Voir toutes les tâches →
              </Link>
            </div>
          </div>
        )}

        {showDropdown && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    </>
  );
}