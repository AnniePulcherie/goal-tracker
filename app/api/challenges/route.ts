import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const challengeSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  color: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const challenges = await prisma.challenge.findMany({
      where: { userId: session.user.id },
      include: {
        entries: { orderBy: { date: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(challenges);
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
    const parsed = challengeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { title, description, startDate, endDate, color } = parsed.data;

    const challenge = await prisma.challenge.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        color: color || "#7c3aed",
        userId: session.user.id,
      },
      include: { entries: true },
    });

    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}