import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const userId = session.user.id;

    const [goals, challenges, todayTasks] = await Promise.all([
      prisma.goal.findMany({
        where: { userId, status: "ACTIVE" },
        include: {
          subGoals: {
            include: { tasks: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.challenge.findMany({
        where: { userId, status: "ACTIVE" },
        include: {
          entries: {
            where: {
              date: { gte: todayStart, lte: todayEnd },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          subGoal: { goal: { userId } },
        },
        include: {
          subGoal: {
            include: {
              goal: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      }),
    ]);

    const totalGoals = await prisma.goal.count({ where: { userId } });
    const completedGoals = await prisma.goal.count({ where: { userId, status: "COMPLETED" } });
    const totalChallenges = await prisma.challenge.count({ where: { userId } });
    const completedChallenges = await prisma.challenge.count({ where: { userId, status: "COMPLETED" } });

    return NextResponse.json({
      goals,
      challenges,
      todayTasks,
      stats: {
        totalGoals,
        completedGoals,
        activeGoals: goals.length,
        totalChallenges,
        completedChallenges,
        activeChallenges: challenges.length,
        todayTasks: todayTasks.length,
        todayCompleted: todayTasks.filter((t) => t.completed).length,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}