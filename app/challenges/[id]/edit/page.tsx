"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const COLORS = [
  "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#2563eb",
];

export default function EditChallengePage() {
  const { id } = useParams();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  async function fetchChallenge() {
    const res = await fetch(`/api/challenges/${id}`);
    const data = await res.json();
    setTitle(data.title);
    setDescription(data.description || "");
    setColor(data.color);
    setStatus(data.status);
    setStartDate(new Date(data.startDate).toISOString().split("T")[0]);
    setEndDate(new Date(data.endDate).toISOString().split("T")[0]);
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/challenges/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        startDate,
        endDate,
        color,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la mise à jour");
      setLoading(false);
    } else {
      router.push(`/challenges/${id}`);
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
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={`/challenges/${id}`}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Retour
          </Link>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Modifier le défi</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">
            Modifier le défi
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du défi <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="ACTIVE">Actif</option>
                <option value="COMPLETED">Terminé</option>
                <option value="ABANDONED">Abandonné</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href={`/challenges/${id}`}
                className="flex-1 text-center py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}