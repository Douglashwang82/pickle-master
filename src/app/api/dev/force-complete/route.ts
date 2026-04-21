import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";
import { guardDevRoute } from "@/lib/utils/dev-route";

export async function POST(request: Request) {
  const guarded = guardDevRoute(request);
  if (guarded) return guarded;

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status: "completed" })
    .neq("status", "completed")
    .select();

  return NextResponse.json({ updated_count: data?.length || 0, error });
}
