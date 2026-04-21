import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "today";

    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date;

    switch (filter) {
      case "week":
        dateFrom = startOfWeek(now, { weekStartsOn: 1 });
        dateTo = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        dateFrom = startOfMonth(now);
        dateTo = endOfMonth(now);
        break;
      default:
        dateFrom = startOfDay(now);
        dateTo = endOfDay(now);
    }

    const tasks = await prisma.task.findMany({
      where: {
        scheduledAt: { gte: dateFrom, lte: dateTo },
        subGoal: {
          goal: { userId: session.user.id },
        },
      },
      include: {
        subGoal: {
          include: {
            goal: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}