import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/db";
import PendingApplicationsPanel, {
  type PendingApplication,
} from "@/components/clubs/manage/PendingApplicationsPanel";
import MembersTable, {
  type MemberRow,
} from "@/components/clubs/manage/MembersTable";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ManageMembersPage({ params }: Params) {
  const { slug } = await params;

  const { data: club } = await supabaseAdmin
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!club) notFound();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoISO = ninetyDaysAgo.toISOString();

  const [membersRes, applicationsRes] = await Promise.all([
    supabaseAdmin
      .from("club_memberships")
      .select("id, user_id, role, joined_at, status")
      .eq("club_id", club.id)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
    supabaseAdmin
      .from("membership_applications")
      .select("id, user_id, intro_message, created_at")
      .eq("club_id", club.id)
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const members = membersRes.data ?? [];
  const applications = applicationsRes.data ?? [];

  const userIds = Array.from(
    new Set([
      ...members.map((m) => m.user_id),
      ...applications.map((a) => a.user_id),
    ])
  );

  type Profile = {
    user_id: string;
    display_name: string;
    photo_url: string | null;
    skill_level: string | null;
  };
  const profileMap: Record<string, Profile> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name, photo_url, skill_level")
      .in("user_id", userIds);
    for (const p of profiles ?? []) profileMap[p.user_id] = p as Profile;
  }

  // Aggregations: 90d attendance, total paid, last active
  const memberUserIds = members.map((m) => m.user_id);

  const attendance: Record<string, number> = {};
  const lastActive: Record<string, string> = {};
  if (memberUserIds.length > 0) {
    const { data: regs } = await supabaseAdmin
      .from("session_registrations")
      .select("user_id, created_at, status")
      .in("user_id", memberUserIds)
      .gte("created_at", ninetyDaysAgoISO);
    for (const r of regs ?? []) {
      if (r.status === "confirmed") {
        attendance[r.user_id] = (attendance[r.user_id] ?? 0) + 1;
      }
      if (
        !lastActive[r.user_id] ||
        r.created_at > lastActive[r.user_id]
      ) {
        lastActive[r.user_id] = r.created_at;
      }
    }
  }

  const paidTotal: Record<string, number> = {};
  if (memberUserIds.length > 0) {
    const { data: pays } = await supabaseAdmin
      .from("payment_transactions")
      .select("user_id, amount_twd, status")
      .eq("club_id", club.id)
      .in("user_id", memberUserIds)
      .eq("status", "succeeded");
    for (const p of pays ?? []) {
      paidTotal[p.user_id] = (paidTotal[p.user_id] ?? 0) + p.amount_twd;
    }
  }

  const memberRows: MemberRow[] = members.map((m) => {
    const p = profileMap[m.user_id];
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      display_name: p?.display_name ?? "未命名",
      photo_url: p?.photo_url ?? null,
      skill_level: p?.skill_level ?? null,
      attendance_90d: attendance[m.user_id] ?? 0,
      total_paid: paidTotal[m.user_id] ?? 0,
      last_active_at: lastActive[m.user_id] ?? null,
    };
  });

  const pendingApps: PendingApplication[] = applications.map((a) => ({
    id: a.id,
    user_id: a.user_id,
    intro_message: a.intro_message,
    created_at: a.created_at,
    profile: profileMap[a.user_id]
      ? {
          display_name: profileMap[a.user_id].display_name,
          photo_url: profileMap[a.user_id].photo_url,
          skill_level: profileMap[a.user_id].skill_level,
        }
      : null,
  }));

  return (
    <div className="space-y-5">
      <PendingApplicationsPanel clubId={club.id} applications={pendingApps} />
      <div>
        <h2 className="text-base font-semibold mb-3">
          正式成員（{members.length}）
        </h2>
        <MembersTable members={memberRows} />
      </div>
    </div>
  );
}
