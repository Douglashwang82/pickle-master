-- =============================================================
-- Club Discovery Feature
-- Adds district, membership_type, and full-text search to clubs.
-- Adds a get_public_clubs() RPC for filtered/sorted/paginated
-- discovery queries with member count and session aggregates.
-- =============================================================

-- ---------------------------------------------------------------
-- 1. Schema additions to the clubs table
-- ---------------------------------------------------------------

-- District where the club primarily plays.
-- Covers the 12 Taipei City administrative districts plus
-- New Taipei City (新北市) and a catch-all (其他).
ALTER TABLE clubs
  ADD COLUMN district text
    CHECK (district IN (
      '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
      '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區',
      '新北市', '其他'
    ));

-- Membership join type:
--   'open'        → user joins immediately (no approval queue)
--   'application' → leader must approve (existing default behaviour)
ALTER TABLE clubs
  ADD COLUMN membership_type text
    NOT NULL DEFAULT 'application'
    CHECK (membership_type IN ('open', 'application'));

-- Generated tsvector column for fast full-text search on
-- club name + description.  'simple' dictionary tokenises
-- without language-specific stemming, which handles
-- Traditional Chinese + English mixed content better than 'english'.
ALTER TABLE clubs
  ADD COLUMN fts tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(name, '') || ' ' || coalesce(description, '')
      )
    ) STORED;

-- ---------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------

CREATE INDEX idx_clubs_district ON clubs (district)
  WHERE status = 'active' AND public_status = 'public';

CREATE INDEX idx_clubs_membership_type ON clubs (membership_type)
  WHERE status = 'active' AND public_status = 'public';

CREATE INDEX idx_clubs_fts ON clubs USING GIN (fts);

-- ---------------------------------------------------------------
-- 3. RPC: get_public_clubs
-- Returns public, active clubs with enriched aggregates.
-- All parameters are optional; omitting them removes that filter.
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_public_clubs(
  p_search      text    DEFAULT NULL,
  p_district    text    DEFAULT NULL,
  p_membership  text    DEFAULT NULL,
  p_sort        text    DEFAULT 'newest',
  p_limit       int     DEFAULT 20,
  p_offset      int     DEFAULT 0
)
RETURNS TABLE (
  id                     uuid,
  slug                   text,
  name                   text,
  description            text,
  district               text,
  membership_type        text,
  cover_image_url        text,
  public_status          text,
  created_at             timestamptz,
  member_count           bigint,
  upcoming_session_count bigint,
  next_session_at        timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id,
    c.slug,
    c.name,
    c.description,
    c.district,
    c.membership_type,
    c.cover_image_url,
    c.public_status,
    c.created_at,
    COUNT(DISTINCT cm.id)
      FILTER (WHERE cm.status = 'active')                        AS member_count,
    COUNT(DISTINCT s.id)
      FILTER (
        WHERE s.status IN ('published', 'full')
          AND s.scheduled_start_at >= now()
          AND s.scheduled_start_at <= now() + interval '30 days'
      )                                                          AS upcoming_session_count,
    MIN(s.scheduled_start_at)
      FILTER (
        WHERE s.status IN ('published', 'full')
          AND s.scheduled_start_at >= now()
      )                                                          AS next_session_at
  FROM  clubs c
  LEFT  JOIN club_memberships cm ON cm.club_id = c.id
  LEFT  JOIN sessions         s  ON s.club_id  = c.id
  WHERE
    c.status        = 'active'
    AND c.public_status = 'public'
    AND (p_district   IS NULL OR c.district        = p_district)
    AND (p_membership IS NULL OR c.membership_type = p_membership)
    AND (
      p_search IS NULL
      OR c.fts @@ to_tsquery('simple', p_search || ':*')
    )
  GROUP BY c.id
  ORDER BY
    CASE WHEN p_sort = 'most_members'
      THEN COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'active')
    END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_active'
      THEN COUNT(DISTINCT s.id) FILTER (
        WHERE s.status IN ('published', 'full')
          AND s.scheduled_start_at >= now()
          AND s.scheduled_start_at <= now() + interval '30 days'
      )
    END DESC NULLS LAST,
    c.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ---------------------------------------------------------------
-- 4. RPC: count_public_clubs
-- Lightweight total count query for pagination.
-- Mirrors the WHERE conditions of get_public_clubs exactly.
-- ---------------------------------------------------------------

CREATE OR REPLACE FUNCTION count_public_clubs(
  p_search      text  DEFAULT NULL,
  p_district    text  DEFAULT NULL,
  p_membership  text  DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)
  FROM   clubs c
  WHERE
    c.status        = 'active'
    AND c.public_status = 'public'
    AND (p_district   IS NULL OR c.district        = p_district)
    AND (p_membership IS NULL OR c.membership_type = p_membership)
    AND (
      p_search IS NULL
      OR c.fts @@ to_tsquery('simple', p_search || ':*')
    );
$$;
