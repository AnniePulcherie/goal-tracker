import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  format,
} from "date-fns";
import { fr } from "date-fns/locale";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const userId = session.user.id;

    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        subGoals: {
          include: { tasks: true },
        },
      },
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === "COMPLETED").length;
    const activeGoals = goals.filter((g) => g.status === "ACTIVE").length;

    const allTasks = goals.flatMap((g) =>
      g.subGoals.flatMap((sg) => sg.tasks)
    );
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.completed).length;

    const todayTasks = allTasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return d >= startOfDay(now) && d <= endOfDay(now);
    });
    const todayCompleted = todayTasks.filter((t) => t.completed).length;

    const weekTasks = allTasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return (
        d >= startOfWeek(now, { weekStartsOn: 1 }) &&
        d <= endOfWeek(now, { weekStartsOn: 1 })
      );
    });
    const weekCompleted = weekTasks.filter((t) => t.completed).length;

    const monthTasks = allTasks.filter((t) => {
      const d = new Date(t.scheduledAt);
      return d >= startOfMonth(now) && d <= endOfMonth(now);
    });
    const monthCompleted = monthTasks.filter((t) => t.completed).length;

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayTasks = allTasks.filter((t) => {
        const d = new Date(t.scheduledAt);
        return d >= dayStart && d <= dayEnd;
      });
      return {
        date: format(day, "EEE d", { locale: fr }),
        total: dayTasks.length,
        completed: dayTasks.filter((t) => t.completed).length,
      };
    });

    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const weekStart = startOfWeek(subDays(now, (3 - i) * 7), {
        weekStartsOn: 1,
      });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekTasksData = allTasks.filter((t) => {
        const d = new Date(t.scheduledAt);
        return d >= weekStart && d <= weekEnd;
      });
      return {
        date: format(weekStart, "d MMM", { locale: fr }),
        total: weekTasksData.length,
        completed: weekTasksData.filter((t) => t.completed).length,
      };
    });

    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = subDays(now, i);
      const dayTasks = allTasks.filter((t) => {
        const d = new Date(t.scheduledAt);
        return (
          d >= startOfDay(day) &&
          d <= endOfDay(day) &&
          t.completed
        );
      });
      if (dayTasks.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    const goalsProgress = goals
      .filter((g) => g.status === "ACTIVE")
      .map((g) => {
        const gTasks = g.subGoals.flatMap((sg) => sg.tasks);
        return {
          title:
            g.title.length > 20 ? g.title.substring(0, 20) + "..." : g.title,
          progress: g.progress,
          total: gTasks.length,
          completed: gTasks.filter((t) => t.completed).length,
        };
      });

    return NextResponse.json({
      totalGoals,
      completedGoals,
      activeGoals,
      totalTasks,
      completedTasks,
      todayTasks: todayTasks.length,
      todayCompleted,
      weekTasks: weekTasks.length,
      weekCompleted,
      monthTasks: monthTasks.length,
      monthCompleted,
      streak,
      last7Days,
      last4Weeks,
      goalsProgress,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}