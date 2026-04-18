import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import InvitePage from "./InvitePage";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export default async function InviteTokenPage({ params }: Params) {
  const { token } = await params;

  // Validate token server-side
  const { data: link } = await supabaseAdmin
    .from("club_invite_links")
    .select("id, club_id, use_count, expires_at, max_uses, is_active")
    .eq("token", token)
    .single();

  if (!link || !link.is_active) notFound();
  if (link.expires_at && new Date(link.expires_at) < new Date()) notFound();
  if (link.max_uses !== null && link.use_count >= link.max_uses) notFound();

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id, slug, name, description, cover_image_url, membership_type, status")
    .eq("id", link.club_id)
    .eq("status", "active")
    .single();

  if (!club) notFound();

  const { count: memberCount } = await supabaseAdmin
    .from("club_memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  // Resolve current user (may be null for guests)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let appUserId: string | null = null;
  let alreadyMember = false;
  let pendingApplication = false;

  if (user) {
    const { data: appUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_provider_user_id", user.id)
      .single();

    if (appUser) {
      appUserId = appUser.id;

      const { data: mem } = await supabaseAdmin
        .from("club_memberships")
        .select("status")
        .eq("club_id", club.id)
        .eq("user_id", appUser.id)
        .single();
      alreadyMember = mem?.status === "active";

      if (!alreadyMember) {
        const { data: app } = await supabaseAdmin
          .from("membership_applications")
          .select("id")
          .eq("club_id", club.id)
          .eq("user_id", appUser.id)
          .eq("status", "pending")
          .single();
        pendingApplication = !!app;
      }
    }
  }

  return (
    <Suspense fallback={null}>
      <InvitePage
        token={token}
        club={{ ...club, member_count: memberCount ?? 0 }}
        isAuthenticated={!!appUserId}
        alreadyMember={alreadyMember}
        pendingApplication={pendingApplication}
      />
    </Suspense>
  );
}
