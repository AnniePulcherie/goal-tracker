"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewGoalPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, deadline }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
    } else {
      router.push(`/goals/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/goals" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Mes objectifs
          </Link>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Nouvel objectif</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Crée ton objectif
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              IA va décomposer ton objectif en sous-objectifs et tâches journalières
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre de l objectif <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Ex: Apprendre le développement web en 3 mois"
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
                placeholder="Décris ton objectif en détail pour que l'IA puisse mieux le décomposer..."
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
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {loading && (
              <div className="bg-purple-50 text-purple-700 text-sm px-4 py-3 rounded-lg border border-purple-100 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                IA analyse et décompose ton objectif... (10-20 secondes)
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/goals"
                className="flex-1 text-center py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Génération en cours..." : "Créer avec l'IA ✨"}
              </button>
            </div>
          </form>
        </div>

        {/* Info box */}
        <div className="mt-4 bg-purple-50 rounded-xl border border-purple-100 p-4">
          <p className="text-sm font-medium text-purple-800 mb-2">Comment ça fonctionne ?</p>
          <ul className="space-y-1.5">
            <li className="text-xs text-purple-700 flex items-start gap-2">
              <span className="mt-0.5">1️⃣</span>
              Tu décris ton objectif
            </li>
            <li className="text-xs text-purple-700 flex items-start gap-2">
              <span className="mt-0.5">2️⃣</span>
              IA le décompose en sous-objectifs clairs
            </li>
            <li className="text-xs text-purple-700 flex items-start gap-2">
              <span className="mt-0.5">3️⃣</span>
              Des tâches journalières sont créées automatiquement
            </li>
            <li className="text-xs text-purple-700 flex items-start gap-2">
              <span className="mt-0.5">4️⃣</span>
              Tu coches tes tâches chaque jour et progresses vers ton objectif
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}