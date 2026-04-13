import { requireAuth, requireClubLeader, isNextResponse } from "@/lib/utils/auth-guard";
import { supabaseAdmin } from "@/lib/db";
import { ok, fail } from "@/lib/utils/api";
import { z } from "zod";

const AnnounceSchema = z.object({
  message: z.string().min(1, "Message is required").max(500).trim(),
});

type Params = { params: Promise<{ clubId: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuth();
  if (isNextResponse(auth)) return auth;

  const { clubId } = await params;

  const guardError = await requireClubLeader(clubId, auth.appUserId);
  if (guardError) return guardError;

  const body: unknown = await request.json().catch(() => ({}));
  const parsed = AnnounceSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation error", "VALIDATION_ERROR", 400, parsed.error.flatten());
  }

  const { message } = parsed.data;

  // Fetch club name
  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("name")
    .eq("id", clubId)
    .single();

  if (!club) return fail("Club not found", "NOT_FOUND", 404);

  // Fetch sender display name
  const { data: senderProfile } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("user_id", auth.appUserId)
    .single();

  const senderName = senderProfile?.display_name ?? "Club leader";

  // Fetch all active members, excluding the sender
  const { data: memberships } = await supabaseAdmin
    .from("club_memberships")
    .select("user_id")
    .eq("club_id", clubId)
    .eq("status", "active")
    .neq("user_id", auth.appUserId);

  const recipients = memberships ?? [];

  if (recipients.length === 0) {
    return ok({ queued: 0 });
  }

  const now = new Date().toISOString();
  const notifications = recipients.map((m) => ({
    user_id: m.user_id,
    channel: "in_app" as const,
    type: "club_announcement",
    payload_json: {
      club_id: clubId,
      club_name: club.name,
      message,
      sender_name: senderName,
    },
    send_at: now,
  }));

  const { error } = await supabaseAdmin.from("notifications").insert(notifications);
  if (error) return fail("Failed to send announcement", "DB_ERROR", 500);

  return ok({ queued: recipients.length });
}
