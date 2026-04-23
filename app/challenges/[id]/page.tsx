"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays, eachDayOfInterval, isSameDay, isToday, isFuture } from "date-fns";
import { fr } from "date-fns/locale";

interface ChallengeEntry {
  id: string;
  date: string;
  success: boolean;
  note: string | null;
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

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [congratulations, setCongratulations] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchChallenge() {
    const res = await fetch(`/api/challenges/${id}`);
    const data = await res.json();
    setChallenge(data);
    setLoading(false);
  }

  async function toggleDay(date: Date, currentSuccess: boolean) {
    const dateStr = format(date, "yyyy-MM-dd");
    setToggling(dateStr);

    const res = await fetch(`/api/challenges/${id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, success: !currentSuccess }),
    });

    const data = await res.json();

    if (!currentSuccess && data.congratulations) {
      setCongratulations(data.congratulations);
      setTimeout(() => setCongratulations(null), 5000);
    }

    await fetchChallenge();
    setToggling(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Défi introuvable</p>
          <Link href="/challenges" className="text-purple-600 hover:underline text-sm">
            ← Retour aux défis
          </Link>
        </div>
      </div>
    );
  }

  const allDays = eachDayOfInterval({
    start: new Date(challenge.startDate),
    end: new Date(challenge.endDate),
  });

  const totalDays = allDays.length;
  const successDays = challenge.entries.filter((e) => e.success).length;
  const successRate = totalDays > 0 ? Math.round((successDays / totalDays) * 100) : 0;
  const daysElapsed = Math.min(
    differenceInDays(new Date(), new Date(challenge.startDate)) + 1,
    totalDays
  );

  function getEntryForDay(date: Date) {
    return challenge!.entries.find((e) => isSameDay(new Date(e.date), date));
  }

  function getStreak() {
    let streak = 0;
    for (let i = 0; i < allDays.length; i++) {
      const day = allDays[allDays.length - 1 - i];
      if (isFuture(day)) continue;
      const entry = getEntryForDay(day);
      if (entry?.success) streak++;
      else if (!isToday(day)) break;
    }
    return streak;
  }

  const streak = getStreak();

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  const firstDayOffset = (new Date(challenge.startDate).getDay() + 6) % 7;
  for (let i = 0; i < firstDayOffset; i++) currentWeek.push(new Date(0));
  for (const day of allDays) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/challenges" className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0">
              ←
            </Link>
            <span className="text-gray-300 flex-shrink-0">|</span>
            <span className="font-semibold text-gray-900 text-sm truncate">
              {challenge.title}
            </span>
          </div>
          <Link
            href={`/challenges/${id}/edit`}
            className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0 ml-2"
          >
            Modifier
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {congratulations && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">🎉</span>
            <p className="font-medium text-sm">{congratulations}</p>
          </div>
        )}

        {/* Header du défi */}
        <div
          className="rounded-2xl p-5 text-white mb-4"
          style={{ backgroundColor: challenge.color }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{challenge.title}</h1>
              {challenge.description && (
                <p className="opacity-80 text-sm mt-1">{challenge.description}</p>
              )}
              <p className="opacity-70 text-xs mt-1">
                {format(new Date(challenge.startDate), "d MMM", { locale: fr })} →{" "}
                {format(new Date(challenge.endDate), "d MMM yyyy", { locale: fr })}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="text-3xl font-bold">{daysElapsed}</p>
              <p className="opacity-70 text-xs">/ {totalDays} jours</p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${Math.round((daysElapsed / totalDays) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">🔥{streak}</p>
            <p className="text-xs text-gray-400 mt-0.5">Série</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{successDays}</p>
            <p className="text-xs text-gray-400 mt-0.5">Réussis</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
            <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
            <p className="text-xs text-gray-400 mt-0.5">Taux</p>
          </div>
        </div>

        {/* Calendrier */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">
            Calendrier du défi
          </h2>

          <div className="grid grid-cols-7 mb-1">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => {
                  if (day.getTime() === 0) return <div key={di} />;

                  const entry = getEntryForDay(day);
                  const isSuccess = entry?.success || false;
                  const isFutureDay = isFuture(day) && !isToday(day);
                  const isTodayDay = isToday(day);
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isToggling = toggling === dateStr;

                  return (
                    <button
                      key={di}
                      onClick={() => !isFutureDay && toggleDay(day, isSuccess)}
                      disabled={isFutureDay || isToggling}
                      title={format(day, "d MMMM yyyy", { locale: fr })}
                      className={`
                        aspect-square rounded-lg text-xs font-medium transition-all
                        flex flex-col items-center justify-center
                        ${isFutureDay ? "opacity-30 cursor-not-allowed bg-gray-50" : "cursor-pointer active:scale-95"}
                        ${isSuccess ? "text-white" : isTodayDay ? "ring-2 ring-offset-1 bg-gray-50 text-gray-700" : "bg-gray-50 text-gray-500"}
                        ${isToggling ? "opacity-50" : ""}
                      `}
                      style={isSuccess ? { backgroundColor: challenge.color } : {}}
                    >
                      <span>{format(day, "d")}</span>
                      {isTodayDay && !isSuccess && (
                        <span style={{ fontSize: "7px" }}>auj.</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: challenge.color }} />
              <span className="text-xs text-gray-400">Réussi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-100" />
              <span className="text-xs text-gray-400">Non coché</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-50 opacity-30" />
              <span className="text-xs text-gray-400">À venir</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}