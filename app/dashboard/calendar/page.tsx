"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { fr } from "date-fns/locale";

interface DayData {
  total: number;
  completed: number;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    goalTitle: string;
  }[];
}

type CalendarData = Record<string, DayData>;

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  async function fetchCalendarData() {
    setLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    const data = await res.json();
    setCalendarData(data);
    setLoading(false);
  }

  function prevMonth() {
    setSelectedDay(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setSelectedDay(null);
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  }

  function getDayColor(dayData: DayData | undefined) {
    if (!dayData || dayData.total === 0) return "";
    const rate = dayData.completed / dayData.total;
    if (rate === 1) return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
    if (rate >= 0.5) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  }

  function getDotColor(dayData: DayData | undefined) {
    if (!dayData || dayData.total === 0) return "";
    const rate = dayData.completed / dayData.total;
    if (rate === 1) return "bg-green-500";
    if (rate >= 0.5) return "bg-yellow-400";
    return "bg-red-400";
  }

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getDay(startOfMonth(currentDate));
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const today = format(new Date(), "yyyy-MM-dd");
  const selectedDayData = selectedDay ? calendarData[selectedDay] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">Calendrier</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Calendrier */}
          <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
              >
                ←
              </button>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {format(currentDate, "MMMM yyyy", { locale: fr })}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
              >
                →
              </button>
            </div>

            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Grille */}
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Chargement...</p>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayData = calendarData[dateStr];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDay;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center
                        rounded-xl border text-sm transition-all
                        ${isSelected ? "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800" : "border-transparent"}
                        ${isToday ? "font-bold text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300"}
                        ${getDayColor(dayData)}
                        ${!dayData || dayData.total === 0 ? "hover:bg-gray-50 dark:hover:bg-gray-800" : ""}
                      `}
                    >
                      <span>{day}</span>
                      {dayData && dayData.total > 0 && (
                        <div className="flex gap-0.5 mt-0.5 items-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${getDotColor(dayData)}`} />
                          {dayData.total > 1 && (
                            <span className="text-gray-500 dark:text-gray-400 leading-none" style={{ fontSize: "9px" }}>
                              {dayData.completed}/{dayData.total}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Légende */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-400 dark:text-gray-500">Tout complété</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="text-xs text-gray-400 dark:text-gray-500">En cours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-xs text-gray-400 dark:text-gray-500">Non commencé</span>
              </div>
            </div>
          </div>

          {/* Détail du jour */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            {selectedDay ? (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm">
                  {format(new Date(selectedDay + "T00:00:00"), "d MMMM yyyy", { locale: fr })}
                </h3>
                {!selectedDayData || selectedDayData.total === 0 ? (
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-4">Aucune tâche ce jour</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {selectedDayData.completed}/{selectedDayData.total} tâches
                    </p>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-4">
                      <div
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{ width: `${Math.round((selectedDayData.completed / selectedDayData.total) * 100)}%` }}
                      />
                    </div>
                    <div className="space-y-2">
                      {selectedDayData.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border text-sm ${
                            task.completed
                              ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="mt-0.5 flex-shrink-0">{task.completed ? "✅" : "⬜"}</span>
                            <div>
                              <p className={`font-medium text-xs ${task.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-200"}`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{task.goalTitle}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <span className="text-4xl mb-3">📅</span>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Clique sur un jour pour voir ses tâches
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}