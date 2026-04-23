import { supabaseAdmin } from "@/lib/db";
import { guardDevRoute } from "@/lib/utils/dev-route";
import { NextResponse } from "next/server";

type SeedUser = {
  authId: string;
  id: string;
  email: string;
  displayName: string;
  skillLevel: "beginner" | "intermediate" | "advanced" | "pro";
  avatar: string;
  bio: string;
  reputationScore: number;
  reviewCount: number;
};

type SeedVenue = {
  id: string;
  name: string;
  district: string;
  address: string;
};

type SeedClub = {
  id: string;
  slug: string;
  name: string;
  ownerUserId: string;
  description: string;
  district: string;
  membershipType: "open" | "application";
  coverImageUrl: string;
  rules: string;
};

type SeedMembership = {
  id: string;
  clubId: string;
  userId: string;
  role: "leader" | "member";
  joinedAt: string;
};

type SeedApplication = {
  id: string;
  clubId: string;
  userId: string;
  introMessage: string;
  status: "pending" | "approved";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type SeedSession = {
  id: string;
  clubId: string;
  title: string;
  notes: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  locationName: string;
  venueId: string;
  capacity: number;
  feeTwd: number;
  status: "published" | "full" | "completed";
  createdBy: string;
};

type SeedRegistration = {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
};

type SeedPayment = {
  id: string;
  sessionId: string;
  registrationId: string;
  clubId: string;
  payerUserId: string;
  amountTwd: number;
  platformFeeTwd: number;
  netAmountTwd: number;
  status: "initiated" | "succeeded";
  settledAt: string | null;
  debtNotifiedAt: string | null;
};

type SeedWaitlistEntry = {
  id: string;
  sessionId: string;
  userId: string;
  joinedAt: string;
};

type SeedInviteLink = {
  id: string;
  clubId: string;
  token: string;
  createdBy: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
};

type SeedBoardPost = {
  id: string;
  clubId: string;
  authorUserId: string;
  reviewedBy: string | null;
  kind: "announcement" | "note";
  title: string | null;
  body: string;
  status: "published" | "pending_review";
  importance: "normal" | "important";
  isPinned: boolean;
  publishedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SeedBoardReaction = {
  id: string;
  postId: string;
  userId: string;
  emoji: "👍" | "🎉" | "👏" | "🔥";
  createdAt: string;
};

type SeedNotification = {
  id: string;
  userId: string;
  type: string;
  payloadJson: Record<string, string>;
  status: "pending" | "sent";
  createdAt: string;
};

type SeedReview = {
  id: string;
  venueId: string;
  sessionId: string;
  reviewerUserId: string;
  comment: string;
  createdAt: string;
};

type SeedPeerReview = {
  id: string;
  sessionId: string;
  reviewerUserId: string;
  revieweeUserId: string;
  rating: number;
  badges: string[];
  createdAt: string;
};

function isoOffset(offsetDays: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function addHours(iso: string, hours: number) {
  const date = new Date(iso);
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

const usersToSeed: SeedUser[] = [
  {
    authId: "00000000-0000-0000-0001-000000000001",
    id: "00000000-0000-0000-0002-000000000001",
    email: "leader1@picklemaster.dev",
    displayName: "Avery Chen",
    skillLevel: "pro",
    avatar: "/images/avatars/user-1.png",
    bio: "Club leader focused on fast doubles drills and organized sessions.",
    reputationScore: 4.9,
    reviewCount: 12,
  },
  {
    authId: "00000000-0000-0000-0001-000000000002",
    id: "00000000-0000-0000-0002-000000000002",
    email: "leader2@picklemaster.dev",
    displayName: "Mina Lin",
    skillLevel: "advanced",
    avatar: "/images/avatars/user-2.png",
    bio: "Runs friendly weeknight games with clear communication and quick invites.",
    reputationScore: 4.7,
    reviewCount: 9,
  },
  {
    authId: "00000000-0000-0000-0001-000000000003",
    id: "00000000-0000-0000-0002-000000000003",
    email: "leader3@picklemaster.dev",
    displayName: "Jason Wu",
    skillLevel: "intermediate",
    avatar: "/images/avatars/user-3.png",
    bio: "Weekend organizer who mixes ladder play with beginner-friendly coaching.",
    reputationScore: 4.6,
    reviewCount: 7,
  },
  {
    authId: "00000000-0000-0000-0001-000000000004",
    id: "00000000-0000-0000-0002-000000000004",
    email: "member4@picklemaster.dev",
    displayName: "Rita Huang",
    skillLevel: "beginner",
    avatar: "/images/avatars/user-4.png",
    bio: "New to league play and looking for consistent practice sessions.",
    reputationScore: 4.2,
    reviewCount: 3,
  },
  {
    authId: "00000000-0000-0000-0001-000000000005",
    id: "00000000-0000-0000-0002-000000000005",
    email: "member5@picklemaster.dev",
    displayName: "Daniel Kao",
    skillLevel: "intermediate",
    avatar: "/images/avatars/user-5.png",
    bio: "Reliable doubles partner who prefers evening matches.",
    reputationScore: 4.5,
    reviewCount: 6,
  },
  {
    authId: "00000000-0000-0000-0001-000000000006",
    id: "00000000-0000-0000-0002-000000000006",
    email: "member6@picklemaster.dev",
    displayName: "Yuki Tsai",
    skillLevel: "advanced",
    avatar: "/images/avatars/user-6.png",
    bio: "Plays competitive rec sessions and usually helps fill last-minute spots.",
    reputationScore: 4.8,
    reviewCount: 10,
  },
  {
    authId: "00000000-0000-0000-0001-000000000007",
    id: "00000000-0000-0000-0002-000000000007",
    email: "member7@picklemaster.dev",
    displayName: "Kevin Ho",
    skillLevel: "pro",
    avatar: "/images/avatars/user-7.png",
    bio: "Tournament-minded player who still enjoys mentoring newer members.",
    reputationScore: 4.95,
    reviewCount: 14,
  },
  {
    authId: "00000000-0000-0000-0001-000000000008",
    id: "00000000-0000-0000-0002-000000000008",
    email: "member8@picklemaster.dev",
    displayName: "Lena Yeh",
    skillLevel: "intermediate",
    avatar: "/images/avatars/user-8.png",
    bio: "Steady baseline player who joins social club nights.",
    reputationScore: 4.4,
    reviewCount: 5,
  },
  {
    authId: "00000000-0000-0000-0001-000000000009",
    id: "00000000-0000-0000-0002-000000000009",
    email: "member9@picklemaster.dev",
    displayName: "Oscar Su",
    skillLevel: "beginner",
    avatar: "/images/avatars/user-9.png",
    bio: "Working through the basics and prefers lower-pressure sessions.",
    reputationScore: 4.1,
    reviewCount: 2,
  },
  {
    authId: "00000000-0000-0000-0001-000000000010",
    id: "00000000-0000-0000-0002-000000000010",
    email: "member10@picklemaster.dev",
    displayName: "Nora Peng",
    skillLevel: "advanced",
    avatar: "/images/avatars/user-10.png",
    bio: "Strong communicator who often joins from invite links.",
    reputationScore: 4.55,
    reviewCount: 4,
  },
];

const venuesToSeed: SeedVenue[] = [
  {
    id: "00000000-0000-0000-0004-000000000001",
    name: "Xinyi Sports Center",
    district: "信義區",
    address: "No. 100 Songqin St, Xinyi District, Taipei",
  },
  {
    id: "00000000-0000-0000-0004-000000000002",
    name: "Daan Indoor Courts",
    district: "大安區",
    address: "No. 55 Sec. 3 Xinsheng S. Rd, Daan District, Taipei",
  },
  {
    id: "00000000-0000-0000-0004-000000000003",
    name: "Neihu Pickle Hub",
    district: "內湖區",
    address: "No. 12 Zhouzi St, Neihu District, Taipei",
  },
  {
    id: "00000000-0000-0000-0004-000000000004",
    name: "Zhongshan Riverside Courts",
    district: "中山區",
    address: "Lane 44 Zhongshan N. Rd. Sec. 2, Zhongshan District, Taipei",
  },
  {
    id: "00000000-0000-0000-0004-000000000005",
    name: "Songshan Roof Courts",
    district: "松山區",
    address: "No. 50 Sec. 5 Nanjing E. Rd, Songshan District, Taipei",
  },
];

const clubsToSeed: SeedClub[] = [
  {
    id: "00000000-0000-0000-0003-000000000001",
    slug: "taipei-pros",
    name: "Taipei Pros",
    ownerUserId: "00000000-0000-0000-0002-000000000001",
    description:
      "Competitive club with structured drills, challenge sessions, and strong attendance.",
    district: "信義區",
    membershipType: "application",
    coverImageUrl: "/images/home/general-image-1.jpg",
    rules:
      "Show up 10 minutes early, confirm your payment after joining, and respect court rotation.",
  },
  {
    id: "00000000-0000-0000-0003-000000000002",
    slug: "xinyi-social",
    name: "Xinyi Social Club",
    ownerUserId: "00000000-0000-0000-0002-000000000002",
    description:
      "Open-membership club for easy weeknight play, friendly intros, and quick roster fills.",
    district: "大安區",
    membershipType: "open",
    coverImageUrl: "/images/home/general-image-2.jpg",
    rules:
      "Be welcoming to new players, keep games moving, and settle fees after the session.",
  },
  {
    id: "00000000-0000-0000-0003-000000000003",
    slug: "weekend-warriors",
    name: "Weekend Warriors",
    ownerUserId: "00000000-0000-0000-0002-000000000003",
    description:
      "Saturday-first club balancing match play, coaching, and occasional leader announcements.",
    district: "內湖區",
    membershipType: "application",
    coverImageUrl: "/images/home/general-image-1.jpg",
    rules:
      "Respect assigned courts, report no-shows early, and review venues after completed play.",
  },
];

const membershipsToSeed: SeedMembership[] = [
  { id: "00000000-0000-0000-0005-000000000001", clubId: clubsToSeed[0].id, userId: usersToSeed[0].id, role: "leader", joinedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000002", clubId: clubsToSeed[0].id, userId: usersToSeed[3].id, role: "member", joinedAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000003", clubId: clubsToSeed[0].id, userId: usersToSeed[4].id, role: "member", joinedAt: new Date(Date.now() - 40 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000004", clubId: clubsToSeed[0].id, userId: usersToSeed[5].id, role: "member", joinedAt: new Date(Date.now() - 38 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000005", clubId: clubsToSeed[0].id, userId: usersToSeed[6].id, role: "member", joinedAt: new Date(Date.now() - 35 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000006", clubId: clubsToSeed[0].id, userId: usersToSeed[9].id, role: "member", joinedAt: new Date(Date.now() - 20 * 86400000).toISOString() },

  { id: "00000000-0000-0000-0005-000000000007", clubId: clubsToSeed[1].id, userId: usersToSeed[1].id, role: "leader", joinedAt: new Date(Date.now() - 80 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000008", clubId: clubsToSeed[1].id, userId: usersToSeed[3].id, role: "member", joinedAt: new Date(Date.now() - 32 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000009", clubId: clubsToSeed[1].id, userId: usersToSeed[4].id, role: "member", joinedAt: new Date(Date.now() - 31 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000010", clubId: clubsToSeed[1].id, userId: usersToSeed[5].id, role: "member", joinedAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000011", clubId: clubsToSeed[1].id, userId: usersToSeed[7].id, role: "member", joinedAt: new Date(Date.now() - 28 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000012", clubId: clubsToSeed[1].id, userId: usersToSeed[8].id, role: "member", joinedAt: new Date(Date.now() - 22 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000013", clubId: clubsToSeed[1].id, userId: usersToSeed[9].id, role: "member", joinedAt: new Date(Date.now() - 18 * 86400000).toISOString() },

  { id: "00000000-0000-0000-0005-000000000014", clubId: clubsToSeed[2].id, userId: usersToSeed[2].id, role: "leader", joinedAt: new Date(Date.now() - 85 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000015", clubId: clubsToSeed[2].id, userId: usersToSeed[4].id, role: "member", joinedAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000016", clubId: clubsToSeed[2].id, userId: usersToSeed[5].id, role: "member", joinedAt: new Date(Date.now() - 21 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000017", clubId: clubsToSeed[2].id, userId: usersToSeed[6].id, role: "member", joinedAt: new Date(Date.now() - 18 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0005-000000000018", clubId: clubsToSeed[2].id, userId: usersToSeed[7].id, role: "member", joinedAt: new Date(Date.now() - 15 * 86400000).toISOString() },
];

const applicationsToSeed: SeedApplication[] = [
  {
    id: "00000000-0000-0000-0012-000000000001",
    clubId: clubsToSeed[0].id,
    userId: usersToSeed[7].id,
    introMessage: "Interested in joining the advanced ladder nights and weekday doubles.",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0012-000000000002",
    clubId: clubsToSeed[2].id,
    userId: usersToSeed[9].id,
    introMessage: "Looking for a regular weekend group with coaching and structured rotations.",
    status: "pending",
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const sessionsToSeed: SeedSession[] = [
  {
    id: "00000000-0000-0000-0006-000000000001",
    clubId: clubsToSeed[0].id,
    title: "Tuesday Matchplay",
    notes: "Completed competitive ladder with venue review coverage.",
    scheduledStartAt: isoOffset(-10, 18),
    scheduledEndAt: addHours(isoOffset(-10, 18), 2),
    locationName: venuesToSeed[0].name,
    venueId: venuesToSeed[0].id,
    capacity: 6,
    feeTwd: 250,
    status: "completed",
    createdBy: usersToSeed[0].id,
  },
  {
    id: "00000000-0000-0000-0006-000000000002",
    clubId: clubsToSeed[0].id,
    title: "Friday Team Drill",
    notes: "Completed session with strong peer feedback participation.",
    scheduledStartAt: isoOffset(-4, 19),
    scheduledEndAt: addHours(isoOffset(-4, 19), 2),
    locationName: venuesToSeed[1].name,
    venueId: venuesToSeed[1].id,
    capacity: 6,
    feeTwd: 250,
    status: "completed",
    createdBy: usersToSeed[0].id,
  },
  {
    id: "00000000-0000-0000-0006-000000000003",
    clubId: clubsToSeed[0].id,
    title: "Saturday Showdown",
    notes: "Full session so the waitlist flow has live data.",
    scheduledStartAt: isoOffset(2, 18),
    scheduledEndAt: addHours(isoOffset(2, 18), 2),
    locationName: venuesToSeed[2].name,
    venueId: venuesToSeed[2].id,
    capacity: 4,
    feeTwd: 300,
    status: "full",
    createdBy: usersToSeed[0].id,
  },
  {
    id: "00000000-0000-0000-0006-000000000004",
    clubId: clubsToSeed[0].id,
    title: "New Member Clinic",
    notes: "Published session with remaining capacity for direct join testing.",
    scheduledStartAt: isoOffset(6, 19),
    scheduledEndAt: addHours(isoOffset(6, 19), 2),
    locationName: venuesToSeed[4].name,
    venueId: venuesToSeed[4].id,
    capacity: 8,
    feeTwd: 150,
    status: "published",
    createdBy: usersToSeed[0].id,
  },
  {
    id: "00000000-0000-0000-0006-000000000007",
    clubId: clubsToSeed[1].id,
    title: "Sunday Open Play",
    notes: "Upcoming open session with room left for dashboard and browse pages.",
    scheduledStartAt: isoOffset(3, 17),
    scheduledEndAt: addHours(isoOffset(3, 17), 2),
    locationName: venuesToSeed[1].name,
    venueId: venuesToSeed[1].id,
    capacity: 10,
    feeTwd: 120,
    status: "published",
    createdBy: usersToSeed[1].id,
  },
  {
    id: "00000000-0000-0000-0006-000000000011",
    clubId: clubsToSeed[2].id,
    title: "Weekend Warrior Queue Test",
    notes: "Full session to validate waitlist visibility for members.",
    scheduledStartAt: isoOffset(4, 18),
    scheduledEndAt: addHours(isoOffset(4, 18), 2),
    locationName: venuesToSeed[3].name,
    venueId: venuesToSeed[3].id,
    capacity: 4,
    feeTwd: 260,
    status: "full",
    createdBy: usersToSeed[2].id,
  },
];

const registrationsToSeed: SeedRegistration[] = [
  { id: "00000000-0000-0000-0007-000000000013", sessionId: sessionsToSeed[2].id, userId: usersToSeed[0].id, joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000014", sessionId: sessionsToSeed[2].id, userId: usersToSeed[3].id, joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000015", sessionId: sessionsToSeed[2].id, userId: usersToSeed[4].id, joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000016", sessionId: sessionsToSeed[2].id, userId: usersToSeed[5].id, joinedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000017", sessionId: sessionsToSeed[3].id, userId: usersToSeed[0].id, joinedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000018", sessionId: sessionsToSeed[3].id, userId: usersToSeed[3].id, joinedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000019", sessionId: sessionsToSeed[3].id, userId: usersToSeed[7].id, joinedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000030", sessionId: sessionsToSeed[4].id, userId: usersToSeed[1].id, joinedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000031", sessionId: sessionsToSeed[4].id, userId: usersToSeed[3].id, joinedAt: new Date(Date.now() - 10 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000032", sessionId: sessionsToSeed[4].id, userId: usersToSeed[4].id, joinedAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000045", sessionId: sessionsToSeed[5].id, userId: usersToSeed[2].id, joinedAt: new Date(Date.now() - 14 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000046", sessionId: sessionsToSeed[5].id, userId: usersToSeed[4].id, joinedAt: new Date(Date.now() - 13 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000047", sessionId: sessionsToSeed[5].id, userId: usersToSeed[5].id, joinedAt: new Date(Date.now() - 12 * 3600000).toISOString() },
  { id: "00000000-0000-0000-0007-000000000048", sessionId: sessionsToSeed[5].id, userId: usersToSeed[6].id, joinedAt: new Date(Date.now() - 11 * 3600000).toISOString() },
];

const paymentsToSeed: SeedPayment[] = [
  {
    id: "00000000-0000-0000-0008-000000000001",
    sessionId: sessionsToSeed[2].id,
    registrationId: "00000000-0000-0000-0007-000000000013",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[0].id,
    amountTwd: 300,
    platformFeeTwd: 15,
    netAmountTwd: 285,
    status: "succeeded",
    settledAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000002",
    sessionId: sessionsToSeed[2].id,
    registrationId: "00000000-0000-0000-0007-000000000014",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[3].id,
    amountTwd: 300,
    platformFeeTwd: 15,
    netAmountTwd: 285,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0008-000000000003",
    sessionId: sessionsToSeed[2].id,
    registrationId: "00000000-0000-0000-0007-000000000015",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[4].id,
    amountTwd: 300,
    platformFeeTwd: 15,
    netAmountTwd: 285,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000004",
    sessionId: sessionsToSeed[2].id,
    registrationId: "00000000-0000-0000-0007-000000000016",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[5].id,
    amountTwd: 300,
    platformFeeTwd: 15,
    netAmountTwd: 285,
    status: "succeeded",
    settledAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000005",
    sessionId: sessionsToSeed[3].id,
    registrationId: "00000000-0000-0000-0007-000000000017",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[0].id,
    amountTwd: 150,
    platformFeeTwd: 8,
    netAmountTwd: 142,
    status: "succeeded",
    settledAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000006",
    sessionId: sessionsToSeed[3].id,
    registrationId: "00000000-0000-0000-0007-000000000018",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[3].id,
    amountTwd: 150,
    platformFeeTwd: 8,
    netAmountTwd: 142,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000007",
    sessionId: sessionsToSeed[3].id,
    registrationId: "00000000-0000-0000-0007-000000000019",
    clubId: clubsToSeed[0].id,
    payerUserId: usersToSeed[7].id,
    amountTwd: 150,
    platformFeeTwd: 8,
    netAmountTwd: 142,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000008",
    sessionId: sessionsToSeed[4].id,
    registrationId: "00000000-0000-0000-0007-000000000030",
    clubId: clubsToSeed[1].id,
    payerUserId: usersToSeed[1].id,
    amountTwd: 120,
    platformFeeTwd: 6,
    netAmountTwd: 114,
    status: "succeeded",
    settledAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000009",
    sessionId: sessionsToSeed[4].id,
    registrationId: "00000000-0000-0000-0007-000000000031",
    clubId: clubsToSeed[1].id,
    payerUserId: usersToSeed[3].id,
    amountTwd: 120,
    platformFeeTwd: 6,
    netAmountTwd: 114,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0008-000000000010",
    sessionId: sessionsToSeed[4].id,
    registrationId: "00000000-0000-0000-0007-000000000032",
    clubId: clubsToSeed[1].id,
    payerUserId: usersToSeed[4].id,
    amountTwd: 120,
    platformFeeTwd: 6,
    netAmountTwd: 114,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000011",
    sessionId: sessionsToSeed[5].id,
    registrationId: "00000000-0000-0000-0007-000000000045",
    clubId: clubsToSeed[2].id,
    payerUserId: usersToSeed[2].id,
    amountTwd: 260,
    platformFeeTwd: 13,
    netAmountTwd: 247,
    status: "succeeded",
    settledAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000012",
    sessionId: sessionsToSeed[5].id,
    registrationId: "00000000-0000-0000-0007-000000000046",
    clubId: clubsToSeed[2].id,
    payerUserId: usersToSeed[4].id,
    amountTwd: 260,
    platformFeeTwd: 13,
    netAmountTwd: 247,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000013",
    sessionId: sessionsToSeed[5].id,
    registrationId: "00000000-0000-0000-0007-000000000047",
    clubId: clubsToSeed[2].id,
    payerUserId: usersToSeed[5].id,
    amountTwd: 260,
    platformFeeTwd: 13,
    netAmountTwd: 247,
    status: "initiated",
    settledAt: null,
    debtNotifiedAt: null,
  },
  {
    id: "00000000-0000-0000-0008-000000000014",
    sessionId: sessionsToSeed[5].id,
    registrationId: "00000000-0000-0000-0007-000000000048",
    clubId: clubsToSeed[2].id,
    payerUserId: usersToSeed[6].id,
    amountTwd: 260,
    platformFeeTwd: 13,
    netAmountTwd: 247,
    status: "succeeded",
    settledAt: new Date(Date.now() - 90 * 60000).toISOString(),
    debtNotifiedAt: null,
  },
];

const waitlistEntries: SeedWaitlistEntry[] = [
  {
    id: "00000000-0000-0000-0013-000000000001",
    sessionId: sessionsToSeed[2].id,
    userId: usersToSeed[6].id,
    joinedAt: new Date(Date.now() - 7 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0013-000000000002",
    sessionId: sessionsToSeed[5].id,
    userId: usersToSeed[7].id,
    joinedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const inviteLinksToSeed: SeedInviteLink[] = [
  {
    id: "00000000-0000-0000-0010-000000000001",
    clubId: clubsToSeed[0].id,
    token: "seed-invite-taipei-pros",
    createdBy: usersToSeed[0].id,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    maxUses: 25,
    useCount: 3,
  },
  {
    id: "00000000-0000-0000-0010-000000000002",
    clubId: clubsToSeed[1].id,
    token: "seed-invite-xinyi-social",
    createdBy: usersToSeed[1].id,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    maxUses: 50,
    useCount: 5,
  },
];

const boardPostsToSeed: SeedBoardPost[] = [
  {
    id: "00000000-0000-0000-0011-000000000001",
    clubId: clubsToSeed[0].id,
    authorUserId: usersToSeed[0].id,
    reviewedBy: usersToSeed[0].id,
    kind: "announcement",
    title: "Saturday showdown courts assigned",
    body: "Court assignments are locked in. Please check in 10 minutes early so we can start on time.",
    status: "published",
    importance: "important",
    isPinned: true,
    publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    reviewedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0011-000000000002",
    clubId: clubsToSeed[0].id,
    authorUserId: usersToSeed[3].id,
    reviewedBy: null,
    kind: "note",
    title: "Ball machine slot request",
    body: "Could we reserve one 20-minute ball machine block during next week's clinic?",
    status: "pending_review",
    importance: "normal",
    isPinned: false,
    publishedAt: null,
    reviewedAt: null,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0011-000000000003",
    clubId: clubsToSeed[1].id,
    authorUserId: usersToSeed[1].id,
    reviewedBy: usersToSeed[1].id,
    kind: "announcement",
    title: "Open play moved indoors",
    body: "Weather backup is confirmed, so Sunday open play will use the indoor courts instead.",
    status: "published",
    importance: "important",
    isPinned: false,
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    reviewedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const boardReactionsToSeed: SeedBoardReaction[] = [
  {
    id: "00000000-0000-0000-0011-000000000101",
    postId: "00000000-0000-0000-0011-000000000001",
    userId: usersToSeed[3].id,
    emoji: "👍",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0011-000000000102",
    postId: "00000000-0000-0000-0011-000000000001",
    userId: usersToSeed[4].id,
    emoji: "🎉",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
];

const notificationsToSeed: SeedNotification[] = [
  {
    id: "00000000-0000-0000-0009-000000000001",
    userId: usersToSeed[3].id,
    type: "payment_reminder",
    payloadJson: {
      session_id: sessionsToSeed[4].id,
      message: "Please pay NT$120 to confirm your spot with the leader.",
    },
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0009-000000000002",
    userId: usersToSeed[4].id,
    type: "club_announcement",
    payloadJson: {
      club_id: clubsToSeed[0].id,
      club_name: clubsToSeed[0].name,
      message: "Saturday showdown courts assigned - Please check in 10 minutes early so we can start on time.",
      sender_name: usersToSeed[0].displayName,
    },
    status: "pending",
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
];

const venueReviewsToSeed: SeedReview[] = [
  {
    id: "00000000-0000-0000-0015-000000000001",
    venueId: venuesToSeed[0].id,
    sessionId: sessionsToSeed[0].id,
    reviewerUserId: usersToSeed[3].id,
    comment: "Great lighting and fast court turnover.",
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0015-000000000002",
    venueId: venuesToSeed[1].id,
    sessionId: sessionsToSeed[1].id,
    reviewerUserId: usersToSeed[4].id,
    comment: "Indoor backup worked well and the floor felt consistent.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const peerReviewsToSeed: SeedPeerReview[] = [
  {
    id: "00000000-0000-0000-0016-000000000001",
    sessionId: sessionsToSeed[0].id,
    reviewerUserId: usersToSeed[3].id,
    revieweeUserId: usersToSeed[4].id,
    rating: 5,
    badges: ["Reliable", "Encouraging"],
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: "00000000-0000-0000-0016-000000000002",
    sessionId: sessionsToSeed[1].id,
    reviewerUserId: usersToSeed[4].id,
    revieweeUserId: usersToSeed[5].id,
    rating: 5,
    badges: ["On Time", "Team Player"],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

export async function GET(request: Request) {
  const guarded = guardDevRoute(request);
  if (guarded) return guarded;

  const { searchParams } = new URL(request.url);
  const reset = searchParams.get("reset") === "true";

  try {
    if (reset) {
      await supabaseAdmin.from("analytics_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("venue_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("peer_reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("session_waitlist_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("payment_transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("session_registrations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("club_board_reactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("club_board_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("club_invite_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("membership_applications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("club_memberships").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("clubs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("venues").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("profiles").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("users").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data: authList, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
    if (authListError) {
      throw authListError;
    }

    for (const seedUser of usersToSeed) {
      const existingAuthUser = authList.users.find((authUser) => authUser.email === seedUser.email);

      if (!existingAuthUser) {
        const { error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
          id: seedUser.authId,
          email: seedUser.email,
          password: "PickleTest123!",
          email_confirm: true,
          user_metadata: {},
        });

        if (createAuthError) {
          throw createAuthError;
        }
      }

      const { error: userError } = await supabaseAdmin.from("users").upsert(
        {
          id: seedUser.id,
          auth_provider_user_id: seedUser.authId,
          email: seedUser.email,
          status: "active",
        },
        { onConflict: "id" }
      );

      if (userError) {
        throw userError;
      }

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: seedUser.id,
          display_name: seedUser.displayName,
          skill_level: seedUser.skillLevel,
          photo_url: seedUser.avatar,
          bio: seedUser.bio,
          contact_preference: "email",
          locale: "zh-TW",
          reputation_score: seedUser.reputationScore,
          review_count: seedUser.reviewCount,
        },
        { onConflict: "user_id" }
      );

      if (profileError) {
        throw profileError;
      }
    }

    const { error: venuesError } = await supabaseAdmin.from("venues").upsert(
      venuesToSeed.map((venue) => ({
        id: venue.id,
        name: venue.name,
        district: venue.district,
        address: venue.address,
      })),
      { onConflict: "id" }
    );
    if (venuesError) throw venuesError;

    const { error: clubsError } = await supabaseAdmin.from("clubs").upsert(
      clubsToSeed.map((club) => ({
        id: club.id,
        slug: club.slug,
        name: club.name,
        owner_user_id: club.ownerUserId,
        description: club.description,
        district: club.district,
        sport_type: "pickleball",
        cover_image_url: club.coverImageUrl,
        rules: club.rules,
        public_status: "public",
        status: "active",
        membership_type: club.membershipType,
      })),
      { onConflict: "id" }
    );
    if (clubsError) throw clubsError;

    const { error: membershipError } = await supabaseAdmin.from("club_memberships").upsert(
      membershipsToSeed.map((membership) => ({
        id: membership.id,
        club_id: membership.clubId,
        user_id: membership.userId,
        role: membership.role,
        status: "active",
        joined_at: membership.joinedAt,
      })),
      { onConflict: "id" }
    );
    if (membershipError) throw membershipError;

    const { error: applicationsError } = await supabaseAdmin.from("membership_applications").upsert(
      applicationsToSeed.map((application) => ({
        id: application.id,
        club_id: application.clubId,
        user_id: application.userId,
        intro_message: application.introMessage,
        status: application.status,
        reviewed_by: application.reviewedBy,
        reviewed_at: application.reviewedAt,
        created_at: application.createdAt,
      })),
      { onConflict: "id" }
    );
    if (applicationsError) throw applicationsError;

    const { error: sessionsError } = await supabaseAdmin.from("sessions").upsert(
      sessionsToSeed.map((session) => ({
        id: session.id,
        club_id: session.clubId,
        title: session.title,
        notes: session.notes,
        scheduled_start_at: session.scheduledStartAt,
        scheduled_end_at: session.scheduledEndAt,
        duration_minutes: 120,
        location_name: session.locationName,
        venue_id: session.venueId,
        capacity: session.capacity,
        fee_twd: session.feeTwd,
        currency: "TWD",
        status: session.status,
        created_by: session.createdBy,
      })),
      { onConflict: "id" }
    );
    if (sessionsError) throw sessionsError;

    const { error: registrationsError } = await supabaseAdmin.from("session_registrations").upsert(
      registrationsToSeed.map((registration) => ({
        id: registration.id,
        session_id: registration.sessionId,
        user_id: registration.userId,
        status: "confirmed",
        joined_at: registration.joinedAt,
      })),
      { onConflict: "id" }
    );
    if (registrationsError) throw registrationsError;

    const { error: paymentsError } = await supabaseAdmin.from("payment_transactions").upsert(
      paymentsToSeed.map((payment) => ({
        id: payment.id,
        session_id: payment.sessionId,
        registration_id: payment.registrationId,
        club_id: payment.clubId,
        payer_user_id: payment.payerUserId,
        gateway: "manual",
        gateway_payment_id: `seed-${payment.id.slice(-4)}`,
        amount_twd: payment.amountTwd,
        platform_fee_twd: payment.platformFeeTwd,
        net_amount_twd: payment.netAmountTwd,
        status: payment.status,
        settled_at: payment.settledAt,
        debt_notified_at: payment.debtNotifiedAt,
      })),
      { onConflict: "id" }
    );
    if (paymentsError) throw paymentsError;

    for (const payment of paymentsToSeed) {
      const { error: registrationUpdateError } = await supabaseAdmin
        .from("session_registrations")
        .update({ payment_transaction_id: payment.id })
        .eq("id", payment.registrationId);

      if (registrationUpdateError) {
        throw registrationUpdateError;
      }
    }

    const { error: waitlistError } = await supabaseAdmin.from("session_waitlist_entries").upsert(
      waitlistEntries.map((entry) => ({
        id: entry.id,
        session_id: entry.sessionId,
        user_id: entry.userId,
        status: "active" as const,
        joined_at: entry.joinedAt,
        created_at: entry.joinedAt,
        updated_at: entry.joinedAt,
      })),
      { onConflict: "id" }
    );
    if (waitlistError) throw waitlistError;

    const { error: inviteError } = await supabaseAdmin.from("club_invite_links").upsert(
      inviteLinksToSeed.map((invite) => ({
        id: invite.id,
        club_id: invite.clubId,
        token: invite.token,
        created_by: invite.createdBy,
        expires_at: invite.expiresAt,
        max_uses: invite.maxUses,
        use_count: invite.useCount,
        is_active: true,
      })),
      { onConflict: "id" }
    );
    if (inviteError) throw inviteError;

    const { error: boardPostError } = await supabaseAdmin.from("club_board_posts").upsert(
      boardPostsToSeed.map((post) => ({
        id: post.id,
        club_id: post.clubId,
        author_user_id: post.authorUserId,
        reviewed_by: post.reviewedBy,
        kind: post.kind,
        title: post.title,
        body: post.body,
        status: post.status,
        importance: post.importance,
        is_pinned: post.isPinned,
        published_at: post.publishedAt,
        reviewed_at: post.reviewedAt,
        created_at: post.createdAt,
        updated_at: post.updatedAt,
      })),
      { onConflict: "id" }
    );
    if (boardPostError) throw boardPostError;

    const { error: boardReactionError } = await supabaseAdmin.from("club_board_reactions").upsert(
      boardReactionsToSeed.map((reaction) => ({
        id: reaction.id,
        post_id: reaction.postId,
        user_id: reaction.userId,
        emoji: reaction.emoji,
        created_at: reaction.createdAt,
      })),
      { onConflict: "id" }
    );
    if (boardReactionError) throw boardReactionError;

    const { error: notificationError } = await supabaseAdmin.from("notifications").upsert(
      notificationsToSeed.map((notification) => ({
        id: notification.id,
        user_id: notification.userId,
        channel: "in_app",
        type: notification.type,
        payload_json: notification.payloadJson,
        status: notification.status,
        send_at: notification.createdAt,
        created_at: notification.createdAt,
      })),
      { onConflict: "id" }
    );
    if (notificationError) throw notificationError;

    const { error: venueReviewError } = await supabaseAdmin.from("venue_reviews").upsert(
      venueReviewsToSeed.map((review) => ({
        id: review.id,
        venue_id: review.venueId,
        session_id: review.sessionId,
        reviewer_user_id: review.reviewerUserId,
        facilities_rating: 5,
        lighting_rating: 4,
        floor_rating: 5,
        transport_rating: 4,
        comment: review.comment,
        created_at: review.createdAt,
      })),
      { onConflict: "id" }
    );
    if (venueReviewError) throw venueReviewError;

    const { error: peerReviewError } = await supabaseAdmin.from("peer_reviews").upsert(
      peerReviewsToSeed.map((review) => ({
        id: review.id,
        session_id: review.sessionId,
        reviewer_user_id: review.reviewerUserId,
        reviewee_user_id: review.revieweeUserId,
        rating: review.rating,
        badges: review.badges,
        created_at: review.createdAt,
      })),
      { onConflict: "id" }
    );
    if (peerReviewError) throw peerReviewError;

    return NextResponse.json({
      success: true,
      message: "Database seeded with current implementation mock data",
      counts: {
        users: usersToSeed.length,
        venues: venuesToSeed.length,
        clubs: clubsToSeed.length,
        memberships: membershipsToSeed.length,
        applications: applicationsToSeed.length,
        sessions: sessionsToSeed.length,
        registrations: registrationsToSeed.length,
        payments: paymentsToSeed.length,
        waitlist_entries: waitlistEntries.length,
        invite_links: inviteLinksToSeed.length,
        board_posts: boardPostsToSeed.length,
        notifications: notificationsToSeed.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown seeding error";
    console.error("Seeding error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
