"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface ChallengeEntry {
  id: string;
  date: string;
  success: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  color: string;
  status: string;
  entries: ChallengeEntry[];
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function fetchChallenges() {
    const res = await fetch("/api/challenges");
    const data = await res.json();
    setChallenges(data);
    setLoading(false);
  }

  async function deleteChallenge(id: string) {
    if (!confirm("Supprimer ce défi et tout son historique ?")) return;
    setDeleting(id);
    await fetch(`/api/challenges/${id}`, { method: "DELETE" });
    setChallenges((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  function getStreak(entries: ChallengeEntry[]) {
    const sorted = [...entries]
      .filter((e) => e.success)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    for (let i = 0; i < sorted.length; i++) {
      const diff = differenceInDays(new Date(), new Date(sorted[i].date));
      if (diff === i || diff === i + 1) streak++;
      else break;
    }
    return streak;
  }

  function getTotalDays(challenge: Challenge) {
    return differenceInDays(new Date(challenge.endDate), new Date(challenge.startDate)) + 1;
  }

  function getSuccessRate(entries: ChallengeEntry[]) {
    if (entries.length === 0) return 0;
    return Math.round((entries.filter((e) => e.success).length / entries.length) * 100);
  }

  const activeChallenges = challenges.filter((c) => c.status === "ACTIVE");
  const otherChallenges = challenges.filter((c) => c.status !== "ACTIVE");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900 text-sm">Mes défis</span>
          </div>
          <Link
            href="/challenges/new"
            className="text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Nouveau
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💪</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun défi en cours
            </h2>
            <p className="text-gray-500 text-sm mb-6 px-4">
              Lance-toi un défi et suis ta progression chaque jour !
            </p>
            <Link
              href="/challenges/new"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Créer mon premier défi
            </Link>
          </div>
        ) : (
          <>
            {activeChallenges.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Actifs ({activeChallenges.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {activeChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      streak={getStreak(challenge.entries)}
                      totalDays={getTotalDays(challenge)}
                      successRate={getSuccessRate(challenge.entries)}
                      onDelete={deleteChallenge}
                      deleting={deleting}
                    />
                  ))}
                </div>
              </div>
            )}

            {otherChallenges.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Autres ({otherChallenges.length})
                </h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {otherChallenges.map((challenge) => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      streak={getStreak(challenge.entries)}
                      totalDays={getTotalDays(challenge)}
                      successRate={getSuccessRate(challenge.entries)}
                      onDelete={deleteChallenge}
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

function ChallengeCard({
  challenge,
  streak,
  totalDays,
  successRate,
  onDelete,
  deleting,
}: {
  challenge: Challenge;
  streak: number;
  totalDays: number;
  successRate: number;
  onDelete: (id: string) => void;
  deleting: string | null;
}) {
  const successDays = challenge.entries.filter((e) => e.success).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:border-purple-200 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base flex-shrink-0"
            style={{ backgroundColor: challenge.color }}
          >
            💪
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-gray-900 truncate text-sm">{challenge.title}</h3>
            {challenge.description && (
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{challenge.description}</p>
            )}
          </div>
        </div>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
          challenge.status === "COMPLETED" ? "bg-green-100 text-green-700" :
          challenge.status === "ABANDONED" ? "bg-red-100 text-red-700" :
          "bg-purple-100 text-purple-700"
        }`}>
          {challenge.status === "ACTIVE" ? "Actif" : challenge.status === "COMPLETED" ? "Terminé" : "Abandonné"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-base font-bold text-orange-500">🔥 {streak}</p>
          <p className="text-xs text-gray-400">Série</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-base font-bold text-purple-600">{successDays}/{totalDays}</p>
          <p className="text-xs text-gray-400">Jours</p>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <p className="text-base font-bold text-green-600">{successRate}%</p>
          <p className="text-xs text-gray-400">Réussite</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${successRate}%`, backgroundColor: challenge.color }}
          />
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">
        {format(new Date(challenge.startDate), "d MMM", { locale: fr })} →{" "}
        {format(new Date(challenge.endDate), "d MMM yyyy", { locale: fr })}
      </p>

      <div className="flex gap-2 pt-2 border-t border-gray-50">
        <Link
          href={`/challenges/${challenge.id}`}
          className="flex-1 text-center text-xs bg-purple-50 text-purple-600 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
        >
          Suivi
        </Link>
        <Link
          href={`/challenges/${challenge.id}/edit`}
          className="flex-1 text-center text-xs bg-gray-50 text-gray-600 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Modifier
        </Link>
        <button
          onClick={() => onDelete(challenge.id)}
          disabled={deleting === challenge.id}
          className="flex-1 text-xs bg-red-50 text-red-500 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting === challenge.id ? "..." : "Supprimer"}
        </button>
      </div>
    </div>
  );
}