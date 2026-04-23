-- =============================================================
-- PickleMaster - Dev Seed Data
-- Mirrors the current implementation and schema used by the app.
-- Safe to run repeatedly.
-- Password for all auth users: PickleTest123!
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- FIXED IDS
-- auth users   : 00000000-0000-0000-0001-00000000000x
-- app users    : 00000000-0000-0000-0002-00000000000x
-- clubs        : 00000000-0000-0000-0003-00000000000x
-- venues       : 00000000-0000-0000-0004-00000000000x
-- memberships  : 00000000-0000-0000-0005-0000000000xx
-- sessions     : 00000000-0000-0000-0006-0000000000xx
-- registrations: 00000000-0000-0000-0007-0000000000xx
-- payments     : 00000000-0000-0000-0008-0000000000xx
-- notifications: 00000000-0000-0000-0009-0000000000xx
-- invites      : 00000000-0000-0000-0010-0000000000xx
-- board posts  : 00000000-0000-0000-0011-0000000000xx
-- applications : 00000000-0000-0000-0012-0000000000xx
-- waitlist     : 00000000-0000-0000-0013-0000000000xx
-- analytics    : 00000000-0000-0000-0014-0000000000xx
-- =============================================================

-- =============================================================
-- 1. AUTH USERS
-- =============================================================

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new
)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader1@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader2@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leader3@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member4@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member5@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member6@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member7@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member8@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member9@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'member10@picklemaster.dev', crypt('PickleTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = now();

INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0001-000000000001', 'leader1@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000001","email":"leader1@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0001-000000000002', 'leader2@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000002","email":"leader2@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0001-000000000003', 'leader3@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000003","email":"leader3@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0001-000000000004', 'member4@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000004","email":"member4@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0001-000000000005', 'member5@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000005","email":"member5@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0001-000000000006', 'member6@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000006","email":"member6@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0001-000000000007', 'member7@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000007","email":"member7@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0001-000000000008', 'member8@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000008","email":"member8@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0001-000000000009', 'member9@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000009","email":"member9@picklemaster.dev"}', 'email', now(), now(), now()),
  ('00000000-0000-0000-0001-000000000010', '00000000-0000-0000-0001-000000000010', 'member10@picklemaster.dev', '{"sub":"00000000-0000-0000-0001-000000000010","email":"member10@picklemaster.dev"}', 'email', now(), now(), now())
ON CONFLICT (id) DO UPDATE
SET
  provider_id = EXCLUDED.provider_id,
  identity_data = EXCLUDED.identity_data,
  updated_at = now();

-- =============================================================
-- 2. APP USERS + PROFILES
-- =============================================================

INSERT INTO users (id, auth_provider_user_id, email, status)
VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0001-000000000001', 'leader1@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0001-000000000002', 'leader2@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0001-000000000003', 'leader3@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0001-000000000004', 'member4@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0001-000000000005', 'member5@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0001-000000000006', 'member6@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0001-000000000007', 'member7@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0001-000000000008', 'member8@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0001-000000000009', 'member9@picklemaster.dev', 'active'),
  ('00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000010', 'member10@picklemaster.dev', 'active')
ON CONFLICT (id) DO UPDATE
SET
  auth_provider_user_id = EXCLUDED.auth_provider_user_id,
  email = EXCLUDED.email,
  status = EXCLUDED.status,
  last_active_at = now();

INSERT INTO profiles (
  user_id,
  display_name,
  photo_url,
  skill_level,
  bio,
  contact_preference,
  locale,
  reputation_score,
  review_count
)
VALUES
  ('00000000-0000-0000-0002-000000000001', 'Avery Chen', '/images/avatars/user-1.png', 'pro', 'Club leader focused on fast doubles drills and organized sessions.', 'email', 'zh-TW', 4.90, 12),
  ('00000000-0000-0000-0002-000000000002', 'Mina Lin', '/images/avatars/user-2.png', 'advanced', 'Runs friendly weeknight games with clear communication and quick invites.', 'email', 'zh-TW', 4.70, 9),
  ('00000000-0000-0000-0002-000000000003', 'Jason Wu', '/images/avatars/user-3.png', 'intermediate', 'Weekend organizer who mixes ladder play with beginner-friendly coaching.', 'email', 'zh-TW', 4.60, 7),
  ('00000000-0000-0000-0002-000000000004', 'Rita Huang', '/images/avatars/user-4.png', 'beginner', 'New to league play and looking for consistent practice sessions.', 'email', 'zh-TW', 4.20, 3),
  ('00000000-0000-0000-0002-000000000005', 'Daniel Kao', '/images/avatars/user-5.png', 'intermediate', 'Reliable doubles partner who prefers evening matches.', 'email', 'zh-TW', 4.50, 6),
  ('00000000-0000-0000-0002-000000000006', 'Yuki Tsai', '/images/avatars/user-6.png', 'advanced', 'Plays competitive rec sessions and usually helps fill last-minute spots.', 'email', 'zh-TW', 4.80, 10),
  ('00000000-0000-0000-0002-000000000007', 'Kevin Ho', '/images/avatars/user-7.png', 'pro', 'Tournament-minded player who still enjoys mentoring newer members.', 'email', 'zh-TW', 4.95, 14),
  ('00000000-0000-0000-0002-000000000008', 'Lena Yeh', '/images/avatars/user-8.png', 'intermediate', 'Steady baseline player who joins social club nights.', 'email', 'zh-TW', 4.40, 5),
  ('00000000-0000-0000-0002-000000000009', 'Oscar Su', '/images/avatars/user-9.png', 'beginner', 'Working through the basics and prefers lower-pressure sessions.', 'email', 'zh-TW', 4.10, 2),
  ('00000000-0000-0000-0002-000000000010', 'Nora Peng', '/images/avatars/user-10.png', 'advanced', 'Strong communicator who often joins from invite links.', 'email', 'zh-TW', 4.55, 4)
ON CONFLICT (user_id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  photo_url = EXCLUDED.photo_url,
  skill_level = EXCLUDED.skill_level,
  bio = EXCLUDED.bio,
  contact_preference = EXCLUDED.contact_preference,
  locale = EXCLUDED.locale,
  reputation_score = EXCLUDED.reputation_score,
  review_count = EXCLUDED.review_count,
  updated_at = now();

-- =============================================================
-- 3. VENUES
-- =============================================================

INSERT INTO venues (id, name, district, address)
VALUES
  ('00000000-0000-0000-0004-000000000001', 'Xinyi Sports Center', '信義區', 'No. 100 Songqin St, Xinyi District, Taipei'),
  ('00000000-0000-0000-0004-000000000002', 'Daan Indoor Courts', '大安區', 'No. 55 Sec. 3 Xinsheng S. Rd, Daan District, Taipei'),
  ('00000000-0000-0000-0004-000000000003', 'Neihu Pickle Hub', '內湖區', 'No. 12 Zhouzi St, Neihu District, Taipei'),
  ('00000000-0000-0000-0004-000000000004', 'Zhongshan Riverside Courts', '中山區', 'Lane 44 Zhongshan N. Rd. Sec. 2, Zhongshan District, Taipei'),
  ('00000000-0000-0000-0004-000000000005', 'Songshan Roof Courts', '松山區', 'No. 50 Sec. 5 Nanjing E. Rd, Songshan District, Taipei')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  district = EXCLUDED.district,
  address = EXCLUDED.address;

-- =============================================================
-- 4. CLUBS
-- =============================================================

INSERT INTO clubs (
  id,
  owner_user_id,
  slug,
  name,
  description,
  sport_type,
  cover_image_url,
  rules,
  public_status,
  status,
  district
)
VALUES
  (
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0002-000000000001',
    'taipei-pros',
    'Taipei Pros',
    'Competitive club with structured drills, challenge sessions, and strong attendance.',
    'pickleball',
    '/images/home/general-image-1.jpg',
    'Show up 10 minutes early, confirm your payment after joining, and respect court rotation.',
    'public',
    'active',
    '信義區'
  ),
  (
    '00000000-0000-0000-0003-000000000002',
    '00000000-0000-0000-0002-000000000002',
    'xinyi-social',
    'Xinyi Social Club',
    'Open-membership club for easy weeknight play, friendly intros, and quick roster fills.',
    'pickleball',
    '/images/home/general-image-2.jpg',
    'Be welcoming to new players, keep games moving, and settle fees after the session.',
    'public',
    'active',
    '大安區'
  ),
  (
    '00000000-0000-0000-0003-000000000003',
    '00000000-0000-0000-0002-000000000003',
    'weekend-warriors',
    'Weekend Warriors',
    'Saturday-first club balancing match play, coaching, and occasional leader announcements.',
    'pickleball',
    '/images/home/general-image-1.jpg',
    'Respect assigned courts, report no-shows early, and review venues after completed play.',
    'public',
    'active',
    '內湖區'
  )
ON CONFLICT (id) DO UPDATE
SET
  owner_user_id = EXCLUDED.owner_user_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sport_type = EXCLUDED.sport_type,
  cover_image_url = EXCLUDED.cover_image_url,
  rules = EXCLUDED.rules,
  public_status = EXCLUDED.public_status,
  status = EXCLUDED.status,
  district = EXCLUDED.district,
  updated_at = now();

UPDATE clubs
SET membership_type = seeded.membership_type
FROM (
  VALUES
    ('00000000-0000-0000-0003-000000000001'::uuid, 'application'::text),
    ('00000000-0000-0000-0003-000000000002'::uuid, 'open'::text),
    ('00000000-0000-0000-0003-000000000003'::uuid, 'application'::text)
) AS seeded(id, membership_type)
WHERE clubs.id = seeded.id;

-- =============================================================
-- 5. MEMBERSHIPS
-- =============================================================

INSERT INTO club_memberships (id, club_id, user_id, role, status, joined_at)
VALUES
  ('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 'leader', 'active', now() - interval '90 days'),
  ('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000004', 'member', 'active', now() - interval '45 days'),
  ('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000005', 'member', 'active', now() - interval '40 days'),
  ('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000006', 'member', 'active', now() - interval '38 days'),
  ('00000000-0000-0000-0005-000000000005', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000007', 'member', 'active', now() - interval '35 days'),
  ('00000000-0000-0000-0005-000000000006', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000010', 'member', 'active', now() - interval '20 days'),

  ('00000000-0000-0000-0005-000000000007', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', 'leader', 'active', now() - interval '80 days'),
  ('00000000-0000-0000-0005-000000000008', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000004', 'member', 'active', now() - interval '32 days'),
  ('00000000-0000-0000-0005-000000000009', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000005', 'member', 'active', now() - interval '31 days'),
  ('00000000-0000-0000-0005-000000000010', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000006', 'member', 'active', now() - interval '30 days'),
  ('00000000-0000-0000-0005-000000000011', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000008', 'member', 'active', now() - interval '28 days'),
  ('00000000-0000-0000-0005-000000000012', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000009', 'member', 'active', now() - interval '22 days'),
  ('00000000-0000-0000-0005-000000000013', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000010', 'member', 'active', now() - interval '18 days'),

  ('00000000-0000-0000-0005-000000000014', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', 'leader', 'active', now() - interval '85 days'),
  ('00000000-0000-0000-0005-000000000015', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000005', 'member', 'active', now() - interval '25 days'),
  ('00000000-0000-0000-0005-000000000016', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000006', 'member', 'active', now() - interval '21 days'),
  ('00000000-0000-0000-0005-000000000017', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000007', 'member', 'active', now() - interval '18 days'),
  ('00000000-0000-0000-0005-000000000018', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000008', 'member', 'active', now() - interval '15 days')
ON CONFLICT (id) DO UPDATE
SET
  club_id = EXCLUDED.club_id,
  user_id = EXCLUDED.user_id,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  joined_at = EXCLUDED.joined_at;

-- =============================================================
-- 6. MEMBERSHIP APPLICATIONS
-- =============================================================

INSERT INTO membership_applications (
  id,
  club_id,
  user_id,
  intro_message,
  status,
  reviewed_by,
  reviewed_at,
  created_at
)
VALUES
  ('00000000-0000-0000-0012-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000008', 'Interested in joining the advanced ladder nights and weekday doubles.', 'pending', NULL, NULL, now() - interval '2 days'),
  ('00000000-0000-0000-0012-000000000002', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000010', 'Looking for a regular weekend group with coaching and structured rotations.', 'pending', NULL, NULL, now() - interval '1 day'),
  ('00000000-0000-0000-0012-000000000003', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000009', 'Applied earlier and was approved as a reference case.', 'approved', '00000000-0000-0000-0002-000000000001', now() - interval '15 days', now() - interval '16 days')
ON CONFLICT (id) DO UPDATE
SET
  club_id = EXCLUDED.club_id,
  user_id = EXCLUDED.user_id,
  intro_message = EXCLUDED.intro_message,
  status = EXCLUDED.status,
  reviewed_by = EXCLUDED.reviewed_by,
  reviewed_at = EXCLUDED.reviewed_at,
  created_at = EXCLUDED.created_at;

-- =============================================================
-- 7. SESSIONS
-- =============================================================

INSERT INTO sessions (
  id,
  club_id,
  title,
  notes,
  scheduled_start_at,
  scheduled_end_at,
  duration_minutes,
  location_name,
  venue_id,
  capacity,
  fee_twd,
  currency,
  status,
  created_by
)
VALUES
  ('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0003-000000000001', 'Tuesday Matchplay', 'Completed competitive ladder with venue review coverage.', now() - interval '10 days', now() - interval '10 days' + interval '2 hours', 120, 'Xinyi Sports Center', '00000000-0000-0000-0004-000000000001', 6, 250, 'TWD', 'completed', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0003-000000000001', 'Friday Team Drill', 'Completed session with strong peer feedback participation.', now() - interval '4 days', now() - interval '4 days' + interval '2 hours', 120, 'Daan Indoor Courts', '00000000-0000-0000-0004-000000000002', 6, 250, 'TWD', 'completed', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0003-000000000001', 'Saturday Showdown', 'Full session so the waitlist flow has live data.', now() + interval '2 days' + interval '18 hours', now() + interval '2 days' + interval '20 hours', 120, 'Neihu Pickle Hub', '00000000-0000-0000-0004-000000000003', 4, 300, 'TWD', 'full', '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0003-000000000001', 'New Member Clinic', 'Published session with remaining capacity for direct join testing.', now() + interval '6 days' + interval '19 hours', now() + interval '6 days' + interval '21 hours', 120, 'Songshan Roof Courts', '00000000-0000-0000-0004-000000000005', 8, 150, 'TWD', 'published', '00000000-0000-0000-0002-000000000001'),

  ('00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0003-000000000002', 'Community Ladder', 'Completed open club event with paid and unpaid examples.', now() - interval '8 days', now() - interval '8 days' + interval '2 hours', 120, 'Zhongshan Riverside Courts', '00000000-0000-0000-0004-000000000004', 6, 180, 'TWD', 'completed', '00000000-0000-0000-0002-000000000002'),
  ('00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0003-000000000002', 'Weeknight Social', 'Recent completed social night for venue detail pages.', now() - interval '3 days', now() - interval '3 days' + interval '2 hours', 120, 'Xinyi Sports Center', '00000000-0000-0000-0004-000000000001', 6, 180, 'TWD', 'completed', '00000000-0000-0000-0002-000000000002'),
  ('00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0003-000000000002', 'Sunday Open Play', 'Upcoming open session with room left for dashboard and browse pages.', now() + interval '3 days' + interval '17 hours', now() + interval '3 days' + interval '19 hours', 120, 'Daan Indoor Courts', '00000000-0000-0000-0004-000000000002', 10, 120, 'TWD', 'published', '00000000-0000-0000-0002-000000000002'),
  ('00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0003-000000000002', 'Rain Backup Rotation', 'Another published session for public discovery sorting.', now() + interval '8 days' + interval '18 hours', now() + interval '8 days' + interval '20 hours', 120, 'Xinyi Sports Center', '00000000-0000-0000-0004-000000000001', 8, 120, 'TWD', 'published', '00000000-0000-0000-0002-000000000002'),

  ('00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0003-000000000003', 'Saturday Warrior Games', 'Completed session used for profile reputation examples.', now() - interval '7 days', now() - interval '7 days' + interval '2 hours', 120, 'Neihu Pickle Hub', '00000000-0000-0000-0004-000000000003', 5, 220, 'TWD', 'completed', '00000000-0000-0000-0002-000000000003'),
  ('00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0003-000000000003', 'Coach and Challenge', 'Completed session with mixed peer review badges.', now() - interval '2 days', now() - interval '2 days' + interval '2 hours', 120, 'Songshan Roof Courts', '00000000-0000-0000-0004-000000000005', 5, 220, 'TWD', 'completed', '00000000-0000-0000-0002-000000000003'),
  ('00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0003-000000000003', 'Weekend Warrior Queue Test', 'Full session to validate waitlist visibility for members.', now() + interval '4 days' + interval '18 hours', now() + interval '4 days' + interval '20 hours', 120, 'Zhongshan Riverside Courts', '00000000-0000-0000-0004-000000000004', 4, 260, 'TWD', 'full', '00000000-0000-0000-0002-000000000003'),
  ('00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0003-000000000003', 'Sunday Fundamentals', 'Published beginner-friendly session with open spots.', now() + interval '9 days' + interval '9 hours', now() + interval '9 days' + interval '11 hours', 120, 'Neihu Pickle Hub', '00000000-0000-0000-0004-000000000003', 8, 160, 'TWD', 'published', '00000000-0000-0000-0002-000000000003')
ON CONFLICT (id) DO UPDATE
SET
  club_id = EXCLUDED.club_id,
  title = EXCLUDED.title,
  notes = EXCLUDED.notes,
  scheduled_start_at = EXCLUDED.scheduled_start_at,
  scheduled_end_at = EXCLUDED.scheduled_end_at,
  duration_minutes = EXCLUDED.duration_minutes,
  location_name = EXCLUDED.location_name,
  venue_id = EXCLUDED.venue_id,
  capacity = EXCLUDED.capacity,
  fee_twd = EXCLUDED.fee_twd,
  currency = EXCLUDED.currency,
  status = EXCLUDED.status,
  created_by = EXCLUDED.created_by,
  updated_at = now();

-- =============================================================
-- 8. REGISTRATIONS
-- =============================================================

INSERT INTO session_registrations (
  id,
  session_id,
  user_id,
  status,
  booking_hold_expires_at,
  payment_transaction_id,
  joined_at,
  cancelled_at
)
VALUES
  ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000001', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),
  ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),
  ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),
  ('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),
  ('00000000-0000-0000-0007-000000000005', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000007', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),
  ('00000000-0000-0000-0007-000000000006', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000010', 'confirmed', NULL, NULL, now() - interval '11 days', NULL),

  ('00000000-0000-0000-0007-000000000007', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000001', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),
  ('00000000-0000-0000-0007-000000000008', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),
  ('00000000-0000-0000-0007-000000000009', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),
  ('00000000-0000-0000-0007-000000000010', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),
  ('00000000-0000-0000-0007-000000000011', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000007', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),
  ('00000000-0000-0000-0007-000000000012', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000010', 'confirmed', NULL, NULL, now() - interval '5 days', NULL),

  ('00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000001', 'confirmed', NULL, NULL, now() - interval '2 days', NULL),
  ('00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '2 days', NULL),
  ('00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '2 days', NULL),
  ('00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '2 days', NULL),

  ('00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0002-000000000001', 'confirmed', NULL, NULL, now() - interval '1 day', NULL),
  ('00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '1 day', NULL),
  ('00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '1 day', NULL),

  ('00000000-0000-0000-0007-000000000020', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000002', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),
  ('00000000-0000-0000-0007-000000000021', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),
  ('00000000-0000-0000-0007-000000000022', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),
  ('00000000-0000-0000-0007-000000000023', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),
  ('00000000-0000-0000-0007-000000000024', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),
  ('00000000-0000-0000-0007-000000000025', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000009', 'confirmed', NULL, NULL, now() - interval '9 days', NULL),

  ('00000000-0000-0000-0007-000000000026', '00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0002-000000000002', 'confirmed', NULL, NULL, now() - interval '4 days', NULL),
  ('00000000-0000-0000-0007-000000000027', '00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '4 days', NULL),
  ('00000000-0000-0000-0007-000000000028', '00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '4 days', NULL),
  ('00000000-0000-0000-0007-000000000029', '00000000-0000-0000-0006-000000000006', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '4 days', NULL),

  ('00000000-0000-0000-0007-000000000030', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0002-000000000002', 'confirmed', NULL, NULL, now() - interval '12 hours', NULL),
  ('00000000-0000-0000-0007-000000000031', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0002-000000000004', 'confirmed', NULL, NULL, now() - interval '10 hours', NULL),
  ('00000000-0000-0000-0007-000000000032', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '8 hours', NULL),

  ('00000000-0000-0000-0007-000000000033', '00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0002-000000000002', 'confirmed', NULL, NULL, now() - interval '6 hours', NULL),
  ('00000000-0000-0000-0007-000000000034', '00000000-0000-0000-0006-000000000008', '00000000-0000-0000-0002-000000000010', 'confirmed', NULL, NULL, now() - interval '5 hours', NULL),

  ('00000000-0000-0000-0007-000000000035', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000003', 'confirmed', NULL, NULL, now() - interval '8 days', NULL),
  ('00000000-0000-0000-0007-000000000036', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '8 days', NULL),
  ('00000000-0000-0000-0007-000000000037', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '8 days', NULL),
  ('00000000-0000-0000-0007-000000000038', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000007', 'confirmed', NULL, NULL, now() - interval '8 days', NULL),
  ('00000000-0000-0000-0007-000000000039', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '8 days', NULL),

  ('00000000-0000-0000-0007-000000000040', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000003', 'confirmed', NULL, NULL, now() - interval '3 days', NULL),
  ('00000000-0000-0000-0007-000000000041', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '3 days', NULL),
  ('00000000-0000-0000-0007-000000000042', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '3 days', NULL),
  ('00000000-0000-0000-0007-000000000043', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000007', 'confirmed', NULL, NULL, now() - interval '3 days', NULL),
  ('00000000-0000-0000-0007-000000000044', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '3 days', NULL),

  ('00000000-0000-0000-0007-000000000045', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0002-000000000003', 'confirmed', NULL, NULL, now() - interval '14 hours', NULL),
  ('00000000-0000-0000-0007-000000000046', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0002-000000000005', 'confirmed', NULL, NULL, now() - interval '13 hours', NULL),
  ('00000000-0000-0000-0007-000000000047', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0002-000000000006', 'confirmed', NULL, NULL, now() - interval '12 hours', NULL),
  ('00000000-0000-0000-0007-000000000048', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0002-000000000007', 'confirmed', NULL, NULL, now() - interval '11 hours', NULL),

  ('00000000-0000-0000-0007-000000000049', '00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0002-000000000003', 'confirmed', NULL, NULL, now() - interval '2 hours', NULL),
  ('00000000-0000-0000-0007-000000000050', '00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0002-000000000008', 'confirmed', NULL, NULL, now() - interval '90 minutes', NULL)
ON CONFLICT (id) DO UPDATE
SET
  session_id = EXCLUDED.session_id,
  user_id = EXCLUDED.user_id,
  status = EXCLUDED.status,
  booking_hold_expires_at = EXCLUDED.booking_hold_expires_at,
  joined_at = EXCLUDED.joined_at,
  cancelled_at = EXCLUDED.cancelled_at;

-- =============================================================
-- 9. PAYMENTS + REGISTRATION LINKS
-- =============================================================

INSERT INTO payment_transactions (
  id,
  session_id,
  registration_id,
  club_id,
  payer_user_id,
  gateway,
  gateway_payment_id,
  amount_twd,
  platform_fee_twd,
  net_amount_twd,
  status,
  failure_code,
  failure_message,
  settled_at,
  debt_notified_at,
  created_at,
  updated_at
)
VALUES
  ('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000013', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 'manual', 'manual-seed-001', 300, 15, 285, 'succeeded', NULL, NULL, now() - interval '1 day', NULL, now() - interval '2 days', now() - interval '1 day'),
  ('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000014', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000004', 'manual', 'manual-seed-002', 300, 15, 285, 'initiated', NULL, NULL, NULL, now() - interval '6 hours', now() - interval '2 days', now()),
  ('00000000-0000-0000-0008-000000000003', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000015', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000005', 'manual', 'manual-seed-003', 300, 15, 285, 'initiated', NULL, NULL, NULL, NULL, now() - interval '2 days', now()),
  ('00000000-0000-0000-0008-000000000004', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0007-000000000016', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000006', 'manual', 'manual-seed-004', 300, 15, 285, 'succeeded', NULL, NULL, now() - interval '1 day', NULL, now() - interval '2 days', now() - interval '1 day'),

  ('00000000-0000-0000-0008-000000000005', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0007-000000000017', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', 'manual', 'manual-seed-005', 150, 8, 142, 'succeeded', NULL, NULL, now() - interval '12 hours', NULL, now() - interval '1 day', now()),
  ('00000000-0000-0000-0008-000000000006', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0007-000000000018', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000004', 'manual', 'manual-seed-006', 150, 8, 142, 'initiated', NULL, NULL, NULL, NULL, now() - interval '1 day', now()),
  ('00000000-0000-0000-0008-000000000007', '00000000-0000-0000-0006-000000000004', '00000000-0000-0000-0007-000000000019', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000008', 'manual', 'manual-seed-007', 150, 8, 142, 'initiated', NULL, NULL, NULL, NULL, now() - interval '1 day', now()),

  ('00000000-0000-0000-0008-000000000008', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0007-000000000030', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', 'manual', 'manual-seed-008', 120, 6, 114, 'succeeded', NULL, NULL, now() - interval '4 hours', NULL, now() - interval '12 hours', now()),
  ('00000000-0000-0000-0008-000000000009', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0007-000000000031', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000004', 'manual', 'manual-seed-009', 120, 6, 114, 'initiated', NULL, NULL, NULL, now() - interval '3 hours', now() - interval '10 hours', now()),
  ('00000000-0000-0000-0008-000000000010', '00000000-0000-0000-0006-000000000007', '00000000-0000-0000-0007-000000000032', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000005', 'manual', 'manual-seed-010', 120, 6, 114, 'initiated', NULL, NULL, NULL, NULL, now() - interval '8 hours', now()),

  ('00000000-0000-0000-0008-000000000011', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0007-000000000045', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', 'manual', 'manual-seed-011', 260, 13, 247, 'succeeded', NULL, NULL, now() - interval '2 hours', NULL, now() - interval '14 hours', now()),
  ('00000000-0000-0000-0008-000000000012', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0007-000000000046', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000005', 'manual', 'manual-seed-012', 260, 13, 247, 'initiated', NULL, NULL, NULL, NULL, now() - interval '13 hours', now()),
  ('00000000-0000-0000-0008-000000000013', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0007-000000000047', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000006', 'manual', 'manual-seed-013', 260, 13, 247, 'initiated', NULL, NULL, NULL, NULL, now() - interval '12 hours', now()),
  ('00000000-0000-0000-0008-000000000014', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0007-000000000048', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000007', 'manual', 'manual-seed-014', 260, 13, 247, 'succeeded', NULL, NULL, now() - interval '90 minutes', NULL, now() - interval '11 hours', now()),

  ('00000000-0000-0000-0008-000000000015', '00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0007-000000000049', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', 'manual', 'manual-seed-015', 160, 8, 152, 'succeeded', NULL, NULL, now() - interval '30 minutes', NULL, now() - interval '2 hours', now()),
  ('00000000-0000-0000-0008-000000000016', '00000000-0000-0000-0006-000000000012', '00000000-0000-0000-0007-000000000050', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000008', 'manual', 'manual-seed-016', 160, 8, 152, 'initiated', NULL, NULL, NULL, NULL, now() - interval '90 minutes', now())
ON CONFLICT (id) DO UPDATE
SET
  session_id = EXCLUDED.session_id,
  registration_id = EXCLUDED.registration_id,
  club_id = EXCLUDED.club_id,
  payer_user_id = EXCLUDED.payer_user_id,
  gateway = EXCLUDED.gateway,
  gateway_payment_id = EXCLUDED.gateway_payment_id,
  amount_twd = EXCLUDED.amount_twd,
  platform_fee_twd = EXCLUDED.platform_fee_twd,
  net_amount_twd = EXCLUDED.net_amount_twd,
  status = EXCLUDED.status,
  failure_code = EXCLUDED.failure_code,
  failure_message = EXCLUDED.failure_message,
  settled_at = EXCLUDED.settled_at,
  debt_notified_at = EXCLUDED.debt_notified_at,
  updated_at = now();

UPDATE session_registrations
SET payment_transaction_id = seeded.payment_id
FROM (
  VALUES
    ('00000000-0000-0000-0007-000000000013'::uuid, '00000000-0000-0000-0008-000000000001'::uuid),
    ('00000000-0000-0000-0007-000000000014'::uuid, '00000000-0000-0000-0008-000000000002'::uuid),
    ('00000000-0000-0000-0007-000000000015'::uuid, '00000000-0000-0000-0008-000000000003'::uuid),
    ('00000000-0000-0000-0007-000000000016'::uuid, '00000000-0000-0000-0008-000000000004'::uuid),
    ('00000000-0000-0000-0007-000000000017'::uuid, '00000000-0000-0000-0008-000000000005'::uuid),
    ('00000000-0000-0000-0007-000000000018'::uuid, '00000000-0000-0000-0008-000000000006'::uuid),
    ('00000000-0000-0000-0007-000000000019'::uuid, '00000000-0000-0000-0008-000000000007'::uuid),
    ('00000000-0000-0000-0007-000000000030'::uuid, '00000000-0000-0000-0008-000000000008'::uuid),
    ('00000000-0000-0000-0007-000000000031'::uuid, '00000000-0000-0000-0008-000000000009'::uuid),
    ('00000000-0000-0000-0007-000000000032'::uuid, '00000000-0000-0000-0008-000000000010'::uuid),
    ('00000000-0000-0000-0007-000000000045'::uuid, '00000000-0000-0000-0008-000000000011'::uuid),
    ('00000000-0000-0000-0007-000000000046'::uuid, '00000000-0000-0000-0008-000000000012'::uuid),
    ('00000000-0000-0000-0007-000000000047'::uuid, '00000000-0000-0000-0008-000000000013'::uuid),
    ('00000000-0000-0000-0007-000000000048'::uuid, '00000000-0000-0000-0008-000000000014'::uuid),
    ('00000000-0000-0000-0007-000000000049'::uuid, '00000000-0000-0000-0008-000000000015'::uuid),
    ('00000000-0000-0000-0007-000000000050'::uuid, '00000000-0000-0000-0008-000000000016'::uuid)
) AS seeded(registration_id, payment_id)
WHERE session_registrations.id = seeded.registration_id;

-- =============================================================
-- 10. WAITLIST
-- =============================================================

INSERT INTO session_waitlist_entries (
  id,
  session_id,
  user_id,
  status,
  joined_at,
  promoted_at,
  left_at,
  promoted_registration_id,
  created_at,
  updated_at
)
VALUES
  ('00000000-0000-0000-0013-000000000001', '00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0002-000000000007', 'active', now() - interval '7 hours', NULL, NULL, NULL, now() - interval '7 hours', now() - interval '7 hours'),
  ('00000000-0000-0000-0013-000000000002', '00000000-0000-0000-0006-000000000011', '00000000-0000-0000-0002-000000000008', 'active', now() - interval '5 hours', NULL, NULL, NULL, now() - interval '5 hours', now() - interval '5 hours')
ON CONFLICT (id) DO UPDATE
SET
  session_id = EXCLUDED.session_id,
  user_id = EXCLUDED.user_id,
  status = EXCLUDED.status,
  joined_at = EXCLUDED.joined_at,
  promoted_at = EXCLUDED.promoted_at,
  left_at = EXCLUDED.left_at,
  promoted_registration_id = EXCLUDED.promoted_registration_id,
  updated_at = EXCLUDED.updated_at;

-- =============================================================
-- 11. INVITE LINKS
-- =============================================================

INSERT INTO club_invite_links (
  id,
  club_id,
  token,
  created_by,
  expires_at,
  max_uses,
  use_count,
  is_active,
  created_at
)
VALUES
  ('00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0003-000000000001', 'seed-invite-taipei-pros', '00000000-0000-0000-0002-000000000001', now() + interval '30 days', 25, 3, true, now() - interval '1 day'),
  ('00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0003-000000000002', 'seed-invite-xinyi-social', '00000000-0000-0000-0002-000000000002', now() + interval '30 days', 50, 5, true, now() - interval '2 days'),
  ('00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0003-000000000003', 'seed-invite-weekend-warriors', '00000000-0000-0000-0002-000000000003', now() + interval '15 days', 20, 1, true, now() - interval '4 hours')
ON CONFLICT (id) DO UPDATE
SET
  club_id = EXCLUDED.club_id,
  token = EXCLUDED.token,
  created_by = EXCLUDED.created_by,
  expires_at = EXCLUDED.expires_at,
  max_uses = EXCLUDED.max_uses,
  use_count = EXCLUDED.use_count,
  is_active = EXCLUDED.is_active,
  created_at = EXCLUDED.created_at;

-- =============================================================
-- 12. CLUB BOARD
-- =============================================================

INSERT INTO club_board_posts (
  id,
  club_id,
  author_user_id,
  reviewed_by,
  kind,
  title,
  body,
  status,
  importance,
  is_pinned,
  rejection_reason,
  published_at,
  reviewed_at,
  created_at,
  updated_at
)
VALUES
  ('00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0002-000000000001', 'announcement', 'Saturday showdown courts assigned', 'Court assignments are locked in. Please check in 10 minutes early so we can start on time.', 'published', 'important', true, NULL, now() - interval '6 hours', now() - interval '6 hours', now() - interval '7 hours', now() - interval '6 hours'),
  ('00000000-0000-0000-0011-000000000002', '00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0002-000000000004', NULL, 'note', 'Ball machine slot request', 'Could we reserve one 20-minute ball machine block during next week''s clinic?', 'pending_review', 'normal', false, NULL, NULL, NULL, now() - interval '2 hours', now() - interval '2 hours'),
  ('00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0002-000000000002', 'announcement', 'Open play moved indoors', 'Weather backup is confirmed, so Sunday open play will use the indoor courts instead.', 'published', 'important', false, NULL, now() - interval '5 hours', now() - interval '5 hours', now() - interval '6 hours', now() - interval '5 hours'),
  ('00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0002-000000000003', 'note', 'Warm-up courts first', 'We will hold one court for warm-ups during the first fifteen minutes.', 'published', 'normal', false, NULL, now() - interval '3 hours', now() - interval '3 hours', now() - interval '4 hours', now() - interval '3 hours')
ON CONFLICT (id) DO UPDATE
SET
  club_id = EXCLUDED.club_id,
  author_user_id = EXCLUDED.author_user_id,
  reviewed_by = EXCLUDED.reviewed_by,
  kind = EXCLUDED.kind,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  status = EXCLUDED.status,
  importance = EXCLUDED.importance,
  is_pinned = EXCLUDED.is_pinned,
  rejection_reason = EXCLUDED.rejection_reason,
  published_at = EXCLUDED.published_at,
  reviewed_at = EXCLUDED.reviewed_at,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

INSERT INTO club_board_reactions (id, post_id, user_id, emoji, created_at)
VALUES
  ('00000000-0000-0000-0011-000000000101', '00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0002-000000000004', '👍', now() - interval '5 hours'),
  ('00000000-0000-0000-0011-000000000102', '00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0002-000000000005', '🎉', now() - interval '5 hours'),
  ('00000000-0000-0000-0011-000000000103', '00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0002-000000000004', '👏', now() - interval '4 hours'),
  ('00000000-0000-0000-0011-000000000104', '00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0002-000000000005', '🔥', now() - interval '2 hours')
ON CONFLICT (id) DO UPDATE
SET
  post_id = EXCLUDED.post_id,
  user_id = EXCLUDED.user_id,
  emoji = EXCLUDED.emoji,
  created_at = EXCLUDED.created_at;

-- =============================================================
-- 13. REVIEWS
-- =============================================================

INSERT INTO venue_reviews (
  id,
  venue_id,
  session_id,
  reviewer_user_id,
  facilities_rating,
  lighting_rating,
  floor_rating,
  transport_rating,
  comment,
  created_at
)
VALUES
  ('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000004', 5, 4, 5, 4, 'Great lighting and fast court turnover.', now() - interval '9 days'),
  ('00000000-0000-0000-0015-000000000002', '00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000005', 4, 5, 4, 4, 'Indoor backup worked well and the floor felt consistent.', now() - interval '3 days'),
  ('00000000-0000-0000-0015-000000000003', '00000000-0000-0000-0004-000000000004', '00000000-0000-0000-0006-000000000005', '00000000-0000-0000-0002-000000000008', 4, 4, 4, 5, 'Easy to reach and solid for open social play.', now() - interval '7 days'),
  ('00000000-0000-0000-0015-000000000004', '00000000-0000-0000-0004-000000000005', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000007', 5, 4, 4, 3, 'Good atmosphere and enough space around the courts.', now() - interval '2 days')
ON CONFLICT (id) DO UPDATE
SET
  venue_id = EXCLUDED.venue_id,
  session_id = EXCLUDED.session_id,
  reviewer_user_id = EXCLUDED.reviewer_user_id,
  facilities_rating = EXCLUDED.facilities_rating,
  lighting_rating = EXCLUDED.lighting_rating,
  floor_rating = EXCLUDED.floor_rating,
  transport_rating = EXCLUDED.transport_rating,
  comment = EXCLUDED.comment,
  created_at = EXCLUDED.created_at;

INSERT INTO peer_reviews (
  id,
  session_id,
  reviewer_user_id,
  reviewee_user_id,
  rating,
  badges,
  created_at
)
VALUES
  ('00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0002-000000000005', 5, ARRAY['Reliable', 'Encouraging'], now() - interval '9 days'),
  ('00000000-0000-0000-0016-000000000002', '00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0002-000000000006', 5, ARRAY['On Time', 'Team Player'], now() - interval '3 days'),
  ('00000000-0000-0000-0016-000000000003', '00000000-0000-0000-0006-000000000009', '00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0002-000000000007', 4, ARRAY['Strong Serve'], now() - interval '6 days'),
  ('00000000-0000-0000-0016-000000000004', '00000000-0000-0000-0006-000000000010', '00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0002-000000000008', 5, ARRAY['Communicative', 'Great Partner'], now() - interval '2 days')
ON CONFLICT (id) DO UPDATE
SET
  session_id = EXCLUDED.session_id,
  reviewer_user_id = EXCLUDED.reviewer_user_id,
  reviewee_user_id = EXCLUDED.reviewee_user_id,
  rating = EXCLUDED.rating,
  badges = EXCLUDED.badges,
  created_at = EXCLUDED.created_at;

-- =============================================================
-- 14. NOTIFICATIONS
-- =============================================================

INSERT INTO notifications (
  id,
  user_id,
  channel,
  type,
  payload_json,
  status,
  send_at,
  created_at
)
VALUES
  (
    '00000000-0000-0000-0009-000000000001',
    '00000000-0000-0000-0002-000000000004',
    'in_app',
    'payment_reminder',
    '{"session_id":"00000000-0000-0000-0006-000000000007","message":"Please pay NT$120 to confirm your spot with the leader."}',
    'pending',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    '00000000-0000-0000-0009-000000000002',
    '00000000-0000-0000-0002-000000000007',
    'in_app',
    'waitlist_promoted',
    '{"session_id":"00000000-0000-0000-0006-000000000003","message":"A seat opened up. You are next in line if another member leaves."}',
    'pending',
    now() - interval '1 hour',
    now() - interval '1 hour'
  ),
  (
    '00000000-0000-0000-0009-000000000003',
    '00000000-0000-0000-0002-000000000005',
    'in_app',
    'club_announcement',
    '{"club_id":"00000000-0000-0000-0003-000000000001","club_name":"Taipei Pros","message":"Saturday showdown courts assigned - Please check in 10 minutes early so we can start on time.","sender_name":"Avery Chen"}',
    'pending',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  )
ON CONFLICT (id) DO UPDATE
SET
  user_id = EXCLUDED.user_id,
  channel = EXCLUDED.channel,
  type = EXCLUDED.type,
  payload_json = EXCLUDED.payload_json,
  status = EXCLUDED.status,
  send_at = EXCLUDED.send_at,
  created_at = EXCLUDED.created_at;

-- =============================================================
-- 15. ANALYTICS
-- =============================================================

INSERT INTO analytics_events (
  id,
  event_name,
  user_id,
  club_id,
  session_id,
  properties_json,
  occurred_at
)
VALUES
  ('00000000-0000-0000-0014-000000000001', 'invite_link_created', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', NULL, '{"source":"seed"}', now() - interval '1 day'),
  ('00000000-0000-0000-0014-000000000002', 'payment_initiated', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0006-000000000007', '{"amount":120,"method":"manual"}', now() - interval '10 hours'),
  ('00000000-0000-0000-0014-000000000003', 'waitlist_joined', '00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0006-000000000011', '{"position":1}', now() - interval '5 hours'),
  ('00000000-0000-0000-0014-000000000004', 'club_board_post_published', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000002', NULL, '{"board_kind":"announcement","board_importance":"important"}', now() - interval '5 hours')
ON CONFLICT (id) DO UPDATE
SET
  event_name = EXCLUDED.event_name,
  user_id = EXCLUDED.user_id,
  club_id = EXCLUDED.club_id,
  session_id = EXCLUDED.session_id,
  properties_json = EXCLUDED.properties_json,
  occurred_at = EXCLUDED.occurred_at;
