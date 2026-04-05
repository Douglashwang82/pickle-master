import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/db";
import { fail } from "@/lib/utils/api";
import { NextResponse } from "next/server";

export type AuthUser = {
  authId: string;
  appUserId: string;
  email: string;
};

/**
 * Verifies the request has a valid Supabase session.
 * Returns { user } on success, or a 401 NextResponse on failure.
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return fail("Unauthorized", "UNAUTHORIZED", 401);
  }

  // Fetch or create the app-level user record
  let { data: appUser } = await supabaseAdmin
    .from("users")
    .select("id, email")
    .eq("auth_provider_user_id", user.id)
    .single();

  if (!appUser) {
    // Auto-create user record if missing
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        auth_provider_user_id: user.id,
        email: user.email ?? "",
      })
      .select("id, email")
      .single();

    if (insertError || !newUser) {
      return fail("Failed to sync user record", "SYNC_ERROR", 500);
    }

    appUser = newUser;

    // Create a default profile
    await supabaseAdmin.from("profiles").upsert({
      user_id: appUser.id,
      display_name: user.email?.split("@")[0] ?? "Player",
    }, { onConflict: "user_id" });
  }

  return { authId: user.id, appUserId: appUser.id, email: appUser.email };
}

/**
 * Verifies the user is an active leader of the specified club.
 * Returns null on success, or a 403 NextResponse on failure.
 */
export async function requireClubLeader(
  clubId: string,
  userId: string
): Promise<null | NextResponse> {
  const { data } = await supabaseAdmin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("role", "leader")
    .eq("status", "active")
    .single();

  if (!data) {
    return fail("Forbidden: leader access required", "FORBIDDEN", 403);
  }
  return null;
}

/**
 * Verifies the user is an active member (or leader) of the specified club.
 * Returns null on success, or a 403 NextResponse on failure.
 */
export async function requireClubMember(
  clubId: string,
  userId: string
): Promise<null | NextResponse> {
  const { data } = await supabaseAdmin
    .from("club_memberships")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (!data) {
    return fail("Forbidden: club membership required", "FORBIDDEN", 403);
  }
  return null;
}

export function isNextResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
