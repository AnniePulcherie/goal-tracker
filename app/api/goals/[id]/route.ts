import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  deadline: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "PAUSED", "CANCELLED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const goal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
      include: {
        subGoals: {
          include: { tasks: { orderBy: { scheduledAt: "asc" } } },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!goal) {
      return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
    }
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

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
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const existing = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
    }
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...parsed.data,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : undefined,
      },
      include: {
        subGoals: {
          include: { tasks: true },
          orderBy: { order: "asc" },
        },
      },
    });
    return NextResponse.json(goal);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.goal.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Objectif introuvable" }, { status: 404 });
    }
    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}