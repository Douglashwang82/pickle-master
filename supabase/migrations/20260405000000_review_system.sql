-- Review System Migration
-- Adds: venues, peer_reviews, venue_reviews
-- Alters: sessions (venue_id), profiles (reputation_score, review_count)

-- ────────────────────────────────────────────────────────────────────────────
-- 1. venues
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE venues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT,
  district    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Add venue_id to sessions (optional FK — existing sessions stay NULL)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE sessions
  ADD COLUMN venue_id UUID REFERENCES venues(id) ON DELETE SET NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Add reputation fields to profiles
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN reputation_score NUMERIC(3,2),
  ADD COLUMN review_count     INT NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. peer_reviews
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE peer_reviews (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating             SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  badges             TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_peer_review UNIQUE (session_id, reviewer_user_id, reviewee_user_id),
  CONSTRAINT no_self_review  CHECK  (reviewer_user_id <> reviewee_user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. venue_reviews
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE venue_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id            UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  session_id          UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reviewer_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  facilities_rating   SMALLINT NOT NULL CHECK (facilities_rating BETWEEN 1 AND 5),
  lighting_rating     SMALLINT NOT NULL CHECK (lighting_rating BETWEEN 1 AND 5),
  floor_rating        SMALLINT NOT NULL CHECK (floor_rating BETWEEN 1 AND 5),
  transport_rating    SMALLINT NOT NULL CHECK (transport_rating BETWEEN 1 AND 5),
  comment             TEXT CHECK (char_length(comment) <= 500),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_venue_review UNIQUE (session_id, reviewer_user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Indexes
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_sessions_venue_id            ON sessions(venue_id);
CREATE INDEX idx_peer_reviews_reviewee        ON peer_reviews(reviewee_user_id);
CREATE INDEX idx_peer_reviews_session_reviewer ON peer_reviews(session_id, reviewer_user_id);
CREATE INDEX idx_venue_reviews_venue_id       ON venue_reviews(venue_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 7. RLS Policies
-- ────────────────────────────────────────────────────────────────────────────

-- venues: public read, service-role write
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues_select_all" ON venues FOR SELECT USING (true);

-- peer_reviews: participants of the same club can read; reviewer inserts their own
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "peer_reviews_select" ON peer_reviews FOR SELECT USING (true);
CREATE POLICY "peer_reviews_insert" ON peer_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- venue_reviews: public read, authenticated insert
ALTER TABLE venue_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venue_reviews_select" ON venue_reviews FOR SELECT USING (true);
CREATE POLICY "venue_reviews_insert" ON venue_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
