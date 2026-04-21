import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]).optional(),
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

    const challenge = await prisma.challenge.findFirst({
      where: { id, userId: session.user.id },
      include: {
        entries: { orderBy: { date: "asc" } },
      },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
    }

    return NextResponse.json(challenge);
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

    const existing = await prisma.challenge.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: {
        ...parsed.data,
        startDate: parsed.data.startDate
          ? new Date(parsed.data.startDate)
          : undefined,
        endDate: parsed.data.endDate
          ? new Date(parsed.data.endDate)
          : undefined,
      },
      include: { entries: true },
    });

    return NextResponse.json(challenge);
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

    const existing = await prisma.challenge.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
    }

    await prisma.challenge.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}