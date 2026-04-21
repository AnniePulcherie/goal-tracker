import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendDailyReminders() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const users = await prisma.user.findMany({
      include: {
        pushSubscriptions: true,
        goals: {
          where: { status: "ACTIVE" },
          include: {
            subGoals: {
              include: {
                tasks: {
                  where: {
                    scheduledAt: { gte: todayStart, lte: todayEnd },
                    completed: false,
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const user of users) {
      if (user.pushSubscriptions.length === 0) continue;

      const pendingTasks = user.goals.flatMap((g) =>
        g.subGoals.flatMap((sg) => sg.tasks)
      );

      if (pendingTasks.length === 0) continue;

      const payload = JSON.stringify({
        title: "🎯 Rappel du jour !",
        body:
          pendingTasks.length === 1
            ? `Tu as 1 tâche à compléter aujourd'hui.`
            : `Tu as ${pendingTasks.length} tâches à compléter aujourd'hui.`,
        url: "/dashboard",
      });

      for (const sub of user.pushSubscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            "statusCode" in error &&
            (error as { statusCode: number }).statusCode === 410
          ) {
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
          }
        }
      }
    }

    console.log(`Rappels envoyés à ${users.length} utilisateurs`);
  } catch (error) {
    console.error("Erreur sendDailyReminders:", error);
  }
}