import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { decomposeGoal } from "@/lib/openai";
import { z } from "zod";
import { addDays } from "date-fns";

const goalSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      include: {
        subGoals: {
          include: { tasks: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { title, description, deadline } = parsed.data;

    const decomposed = await decomposeGoal(
      title,
      description || "",
      deadline || null
    );

    const goal = await prisma.goal.create({
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        userId: session.user.id,
        subGoals: {
          create: decomposed.subGoals.map((sg: { title: string; description: string; order: number; tasks: { title: string; description: string; dayOffset: number }[] }) => ({
            title: sg.title,
            description: sg.description,
            order: sg.order,
            tasks: {
              create: sg.tasks.map((task: { title: string; description: string; dayOffset: number }) => ({
                title: task.title,
                description: task.description,
                scheduledAt: addDays(new Date(), task.dayOffset),
              })),
            },
          })),
        },
      },
      include: {
        subGoals: {
          include: { tasks: true },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}