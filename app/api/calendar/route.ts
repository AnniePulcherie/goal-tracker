import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());

    const date = new Date(year, month, 1);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const tasks = await prisma.task.findMany({
      where: {
        scheduledAt: { gte: monthStart, lte: monthEnd },
        subGoal: {
          goal: { userId: session.user.id },
        },
      },
      include: {
        subGoal: {
          include: {
            goal: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const tasksByDay: Record<string, {
      total: number;
      completed: number;
      tasks: {
        id: string;
        title: string;
        completed: boolean;
        goalTitle: string;
      }[];
    }> = {};

    for (const task of tasks) {
      const day = task.scheduledAt.toISOString().split("T")[0];
      if (!tasksByDay[day]) {
        tasksByDay[day] = { total: 0, completed: 0, tasks: [] };
      }
      tasksByDay[day].total++;
      if (task.completed) tasksByDay[day].completed++;
      tasksByDay[day].tasks.push({
        id: task.id,
        title: task.title,
        completed: task.completed,
        goalTitle: task.subGoal.goal.title,
      });
    }

    return NextResponse.json(tasksByDay);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}