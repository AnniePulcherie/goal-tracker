import { NextResponse } from "next/server";
import { sendDailyReminders } from "@/lib/notifications";

export async function GET() {
  await sendDailyReminders();
  return NextResponse.json({ success: true });
}