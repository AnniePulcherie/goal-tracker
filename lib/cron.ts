import cron from "node-cron";
import { sendDailyReminders } from "@/lib/notifications";

let cronStarted = false;

export function startCronJobs() {
  if (cronStarted) return;
  cronStarted = true;

  cron.schedule("0 8 * * *", async () => {
    console.log("Cron job — envoi des rappels quotidiens...");
    await sendDailyReminders();
  }, {
    timezone: "Indian/Antananarivo",
  });

  console.log("Cron jobs démarrés ✅");
}