"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string | null;
}

export default function EditGoalPage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGoal();
  }, [id]);

  async function fetchGoal() {
    const res = await fetch(`/api/goals/${id}`);
    const data: Goal = await res.json();
    setTitle(data.title);
    setDescription(data.description || "");
    setStatus(data.status);
    setDeadline(
      data.deadline
        ? new Date(data.deadline).toISOString().split("T")[0]
        : ""
    );
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        deadline: deadline || undefined,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la mise à jour");
      setLoading(false);
    } else {
      router.push(`/goals/${id}`);
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={`/goals/${id}`}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Retour
          </Link>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Modifier objectif</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            Modifier objectif
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date limite
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="ACTIVE">Actif</option>
                <option value="PAUSED">Pausé</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href={`/goals/${id}`}
                className="flex-1 text-center py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}