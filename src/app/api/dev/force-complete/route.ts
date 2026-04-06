import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST() {
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .update({ status: "completed" })
    .neq("status", "completed")
    .select();

  return NextResponse.json({ updated_count: data?.length || 0, error });
}
