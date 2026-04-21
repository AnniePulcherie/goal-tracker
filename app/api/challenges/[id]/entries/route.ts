import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateCongratulations } from "@/lib/openai";
import { z } from "zod";
import { startOfDay } from "date-fns";

const entrySchema = z.object({
  date: z.string(),
  success: z.boolean(),
  note: z.string().optional(),
});

export async function POST(
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
    const parsed = entrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const challenge = await prisma.challenge.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!challenge) {
      return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
    }

    const entryDate = startOfDay(new Date(parsed.data.date));

    const entry = await prisma.challengeEntry.upsert({
      where: {
        challengeId_date: {
          challengeId: id,
          date: entryDate,
        },
      },
      update: {
        success: parsed.data.success,
        note: parsed.data.note,
      },
      create: {
        challengeId: id,
        date: entryDate,
        success: parsed.data.success,
        note: parsed.data.note,
      },
    });

    let congratulations: string | null = null;
    if (parsed.data.success) {
      congratulations = await generateCongratulations(
        `Jour réussi du défi : ${challenge.title}`,
        challenge.title
      );
    }

    return NextResponse.json({ entry, congratulations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}