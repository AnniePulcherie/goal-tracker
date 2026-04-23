import { startCronJobs } from "@/lib/cron";
import { NextResponse } from "next/server";

export async function GET() {
  startCronJobs();
  return NextResponse.json({ status: "Cron jobs actifs" });
}