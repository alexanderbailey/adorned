import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { advanceUserCycle } from "@/lib/billing/cycle";

// Hourly cron entry point. Protect with CRON_SECRET — Vercel Cron sets
// `x-vercel-cron`; a Supabase pg_cron job can pass `x-cron-secret`.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const presented = request.headers.get("x-cron-secret");
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  if (!isVercelCron && (!secret || presented !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: due, error } = await admin
    .from("user_subscriptions")
    .select("user_id")
    .eq("status", "active")
    .lte("current_period_end", new Date().toISOString());
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { user_id: string; ok: boolean; error?: string }[] = [];
  for (const row of due ?? []) {
    const r = await advanceUserCycle(row.user_id);
    results.push({
      user_id: row.user_id,
      ok: r.ok,
      error: r.ok ? undefined : r.error,
    });
  }
  return NextResponse.json({ processed: results.length, results });
}

export const GET = POST;
