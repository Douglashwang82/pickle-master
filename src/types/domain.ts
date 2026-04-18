import type { Database } from "./database.types";
import {
  BOARD_POST_IMPORTANCE_LEVELS,
  BOARD_POST_KINDS,
  BOARD_POST_STATUSES,
  BOARD_REACTION_EMOJIS,
} from "@/lib/board-config";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Club = Database["public"]["Tables"]["clubs"]["Row"];
export type ClubMembership = Database["public"]["Tables"]["club_memberships"]["Row"];
export type MembershipApplication = Database["public"]["Tables"]["membership_applications"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionRegistration = Database["public"]["Tables"]["session_registrations"]["Row"];
export type SessionWaitlistEntry = Database["public"]["Tables"]["session_waitlist_entries"]["Row"];
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

export type BoardPostKind = (typeof BOARD_POST_KINDS)[number];
export type BoardPostStatus = (typeof BOARD_POST_STATUSES)[number];
export type BoardPostImportance = (typeof BOARD_POST_IMPORTANCE_LEVELS)[number];
export type BoardReactionEmoji = (typeof BOARD_REACTION_EMOJIS)[number];

export type BoardUserPreview = Pick<Profile, "user_id" | "display_name" | "photo_url">;

export type BoardReactionSummary = {
  emoji: BoardReactionEmoji;
  count: number;
  reacted: boolean;
};

export type BoardPostWithMeta = {
  id: string;
  club_id: string;
  author_user_id: string;
  reviewed_by: string | null;
  kind: BoardPostKind;
  title: string | null;
  body: string;
  status: BoardPostStatus;
  importance: BoardPostImportance;
  is_pinned: boolean;
  rejection_reason: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  author: BoardUserPreview | null;
  reviewer: BoardUserPreview | null;
  reactions: BoardReactionSummary[];
};

export type ClubBoardData = {
  featuredPost: BoardPostWithMeta | null;
  publishedPosts: BoardPostWithMeta[];
  pendingPosts: BoardPostWithMeta[];
};

export type MemberRole = "leader" | "member";
export type MembershipStatus = "active" | "pending" | "removed";
export type SessionStatus = "draft" | "published" | "full" | "cancelled" | "completed" | "auto_closed";
export type RegistrationStatus = "payment_pending" | "confirmed" | "cancelled" | "removed" | "refund_pending" | "refunded";
export type PaymentStatus = "initiated" | "authorized" | "succeeded" | "failed" | "refund_pending" | "partially_refunded" | "refunded";
