import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateCongratulations } from "@/lib/openai";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { completed } = body;

    const task = await prisma.task.findFirst({
      where: {
        id,
        subGoal: { goal: { userId: session.user.id } },
      },
      include: {
        subGoal: {
          include: {
            goal: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    let congratulations: string | null = null;
    if (completed) {
      congratulations = await generateCongratulations(
        task.title,
        task.subGoal.goal.title
      );

      const allTasks = await prisma.task.findMany({
        where: { subGoal: { goalId: task.subGoal.goal.id } },
      });

      const completedCount = allTasks.filter((t) => t.completed).length;
      const progress = Math.round((completedCount / allTasks.length) * 100);

      await prisma.goal.update({
        where: { id: task.subGoal.goal.id },
        data: { progress },
      });
    }

    return NextResponse.json({ task: updatedTask, congratulations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}