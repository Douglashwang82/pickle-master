import { supabaseAdmin } from "@/lib/db";

type EventName =
  | "club_created"
  | "session_created"
  | "session_join_click"
  | "payment_initiated"
  | "payment_success"
  | "payment_failed"
  | "session_cancelled"
  | "membership_applied"
  | "membership_approved"
  | "signup_completed"
  | "profile_completed";

type EventProps = Record<string, string | number | boolean | null>;

export async function trackEvent(
  eventName: EventName,
  props: EventProps & {
    user_id?: string;
    club_id?: string;
    session_id?: string;
  }
) {
  const { user_id, club_id, session_id, ...rest } = props;

  await supabaseAdmin.from("analytics_events").insert({
    event_name: eventName,
    user_id: user_id ?? null,
    club_id: club_id ?? null,
    session_id: session_id ?? null,
    properties_json: rest,
  });
}
