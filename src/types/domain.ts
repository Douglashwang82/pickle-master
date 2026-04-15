import type { Database } from "./database.types";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type ClubMembership = Database["public"]["Tables"]["club_memberships"]["Row"];
export type MembershipApplication = Database["public"]["Tables"]["membership_applications"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionRegistration = Database["public"]["Tables"]["session_registrations"]["Row"];
export type PaymentTransaction = Database["public"]["Tables"]["payment_transactions"]["Row"];
export type RefundTransaction = Database["public"]["Tables"]["refund_transactions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Enriched types used in UI
export type ClubWithMemberCount = Club & { member_count: number };

// Enriched club type returned by the get_public_clubs RPC.
// Used on the public discovery page and map view.
export type ClubWithDiscovery = Pick<
  Club,
  "id" | "slug" | "name" | "description" | "cover_image_url" | "public_status"
> & {
  district: string | null;
  skill_levels: string[];
  membership_type: "open" | "application";
  member_count: number;
  upcoming_session_count: number;
  next_session_at: string | null;
  distance_km: number | null;
};

export type SessionWithSpots = Session & {
  confirmed_count: number;
  available_spots: number;
};

export type RegistrationWithProfile = SessionRegistration & {
  profile: Pick<Profile, "user_id" | "display_name" | "photo_url" | "skill_level">;
};

export type MemberWithProfile = ClubMembership & {
  profile: Pick<Profile, "user_id" | "display_name" | "photo_url" | "skill_level">;
};

export type ApplicationWithProfile = MembershipApplication & {
  profile: Pick<Profile, "user_id" | "display_name" | "photo_url" | "bio" | "skill_level">;
};

// Debt info attached to a roster registration row
export type DebtInfo = {
  id: string;
  status: "initiated" | "succeeded" | "failed" | "refund_pending" | "refunded";
  amount_twd: number;
  debt_notified_at: string | null;
};

export type RegistrationWithPayment = SessionRegistration & {
  profile: Pick<Profile, "user_id" | "display_name" | "photo_url" | "skill_level">;
  payment: DebtInfo | null;
};

export type MemberRole = "leader" | "member";
export type MembershipStatus = "active" | "pending" | "removed";
export type SessionStatus = "draft" | "published" | "full" | "cancelled" | "completed" | "auto_closed";
export type RegistrationStatus = "payment_pending" | "confirmed" | "cancelled" | "removed" | "refund_pending" | "refunded";
export type PaymentStatus = "initiated" | "authorized" | "succeeded" | "failed" | "refund_pending" | "partially_refunded" | "refunded";
