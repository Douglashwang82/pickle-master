import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/clubs";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Upsert the app-level user record
  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_provider_user_id", data.user.id)
    .single();

  if (!existingUser) {
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_provider_user_id: data.user.id,
        email: data.user.email ?? "",
      })
      .select("id")
      .single();

    if (insertError || !newUser) {
      return NextResponse.redirect(`${origin}/login?error=user_creation_failed`);
    }

    // Create a default profile
    await supabaseAdmin.from("profiles").insert({
      user_id: newUser.id,
      display_name: data.user.email?.split("@")[0] ?? "New Player",
    });

    // Redirect new users to complete profile
    return NextResponse.redirect(`${origin}/profile?new=1`);
  }

  // Update last_active_at
  await supabaseAdmin
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("auth_provider_user_id", data.user.id);

  return NextResponse.redirect(`${origin}${next}`);
}
