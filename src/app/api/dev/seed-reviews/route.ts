import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db";

export async function POST() {
  try {
    // 1. Create a dummy venue if it doesn't exist
    let { data: venue } = await supabaseAdmin.from("venues").select("*").limit(1).single();
    if (!venue) {
      const { data: newVenue, error: venueError } = await supabaseAdmin.from("venues").insert({
        name: "Test Arena",
        address: "123 Test St",
        city: "Test City",
        courts_count: 4,
        indoor: true
      }).select().single();
      if (venueError) throw venueError;
      venue = newVenue;
    }

    // 2. Create a dummy user to be the "other player"
    let { data: dummyAppUser } = await supabaseAdmin.from("users").select("*").eq("email", "dummy@test.com").single();
    if (!dummyAppUser) {
      // For testing peer review, we just need the app user. It won't be able to login without auth user, but it's enough for foreign keys
      const { data: newUser, error: userError } = await supabaseAdmin.from("users").insert({
        auth_provider_user_id: "test-dummy-auth-id",
        email: "dummy@test.com",
      }).select().single();
      if (userError) throw userError;
      dummyAppUser = newUser;

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        user_id: dummyAppUser.id,
        display_name: "Dummy Player",
        reputation_score: 5,
        review_count: 1
      });
    }

    // 3. Complete all sessions and ensure dummy user is in them
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("sessions")
      .select("id");
    if (sessionsError) throw sessionsError;

    for (const session of sessions || []) {
      await supabaseAdmin.from("sessions").update({ status: "completed" }).eq("id", session.id);
      
      // Ensure dummy user is registered
      const { data: existingReg } = await supabaseAdmin.from("session_registrations")
        .select("*")
        .eq("session_id", session.id)
        .eq("user_id", dummyAppUser.id)
        .single();
      
      if (!existingReg) {
        await supabaseAdmin.from("session_registrations").insert({
          session_id: session.id,
          user_id: dummyAppUser.id,
          status: "confirmed"
        });
      }
    }

    return NextResponse.json({ success: true, venue, dummyAppUser, sessions_updated: sessions?.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
