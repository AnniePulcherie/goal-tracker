"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COLORS = [
  "#7c3aed", "#db2777", "#dc2626", "#ea580c",
  "#ca8a04", "#16a34a", "#0891b2", "#2563eb",
];

const DURATIONS = [
  { label: "7 jours", days: 7 },
  { label: "21 jours", days: 21 },
  { label: "30 jours", days: 30 },
  { label: "66 jours", days: 66 },
  { label: "90 jours", days: 90 },
  { label: "100 jours", days: 100 },
];

export default function NewChallengePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function applyDuration(days: number) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    setEndDate(end.toISOString().split("T")[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!endDate) {
      setError("Choisis une date de fin ou une durée");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, startDate, endDate, color }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Erreur lors de la création");
      setLoading(false);
    } else {
      router.push(`/challenges/${data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/challenges" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Mes défis
          </Link>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">Nouveau défi</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              Crée ton défi
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Définis un défi quotidien et suis ta progression jour par jour
            </p>
          </div>

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
                placeholder="Ex: 30 jours sans sucre, 66 jours de sport..."
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
                placeholder="Décris les règles de ton défi..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur du défi
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée rapide
              </label>
              <div className="flex gap-2 flex-wrap">
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => applyDuration(d.days)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            {/* Aperçu */}
            {endDate && (
              <div
                className="rounded-xl p-4 text-white"
                style={{ backgroundColor: color }}
              >
                <p className="font-semibold">{title || "Mon défi"}</p>
                <p className="text-sm opacity-80 mt-1">
                  {Math.abs(
                    Math.ceil(
                      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  ) + 1}{" "}
                  jours de défi 💪
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Link
                href="/challenges"
                className="flex-1 text-center py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Création..." : "Lancer le défi 💪"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}