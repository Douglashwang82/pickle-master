-- =============================================================
-- P1: Skill-level matching + GPS proximity for club discovery
-- =============================================================

-- Enable PostGIS (pre-installed in Supabase; safe to run repeatedly)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------------------------------------------------------------
-- 1. skill_levels column on clubs
--    Array of skill levels a club is suitable for.
--    Empty array means "all levels welcome" and matches any filter.
-- ---------------------------------------------------------------
ALTER TABLE clubs
  ADD COLUMN skill_levels text[]
    NOT NULL DEFAULT '{}'
    CHECK (
      skill_levels <@ ARRAY['beginner','intermediate','advanced','pro']::text[]
    );

CREATE INDEX idx_clubs_skill_levels ON clubs USING GIN (skill_levels)
  WHERE status = 'active' AND public_status = 'public';

-- ---------------------------------------------------------------
-- 2. location_point column on clubs (PostGIS geography)
--    Stored as WGS-84 lon/lat point so PostGIS distance functions
--    return metres directly.
-- ---------------------------------------------------------------
ALTER TABLE clubs
  ADD COLUMN location_point geography(Point, 4326);

CREATE INDEX idx_clubs_location ON clubs USING GIST (location_point);

-- ---------------------------------------------------------------
-- 3. Drop old RPCs and recreate with new signatures
-- ---------------------------------------------------------------

DROP FUNCTION IF EXISTS get_public_clubs(text, text, text, text, int, int);
DROP FUNCTION IF EXISTS count_public_clubs(text, text, text);

-- ---------------------------------------------------------------
-- 3a. get_public_clubs — filtered, sorted, paginated
-- ---------------------------------------------------------------
CREATE FUNCTION get_public_clubs(
  p_search      text    DEFAULT NULL,
  p_district    text    DEFAULT NULL,
  p_membership  text    DEFAULT NULL,
  p_skill       text    DEFAULT NULL,   -- filter by single skill level
  p_lat         float8  DEFAULT NULL,   -- GPS latitude  (WGS-84)
  p_lng         float8  DEFAULT NULL,   -- GPS longitude (WGS-84)
  p_radius_km   float8  DEFAULT 5.0,    -- search radius in km
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
  skill_levels           text[],
  membership_type        text,
  cover_image_url        text,
  public_status          text,
  created_at             timestamptz,
  member_count           bigint,
  upcoming_session_count bigint,
  next_session_at        timestamptz,
  distance_km            float8           -- NULL when no GPS filter active
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id,
    c.slug,
    c.name,
    c.description,
    c.district,
    c.skill_levels,
    c.membership_type,
    c.cover_image_url,
    c.public_status,
    c.created_at,
    COUNT(DISTINCT cm.id)
      FILTER (WHERE cm.status = 'active')                              AS member_count,
    COUNT(DISTINCT s.id)
      FILTER (
        WHERE s.status IN ('published', 'full')
          AND s.scheduled_start_at >= now()
          AND s.scheduled_start_at <= now() + interval '30 days'
      )                                                                AS upcoming_session_count,
    MIN(s.scheduled_start_at)
      FILTER (
        WHERE s.status IN ('published', 'full')
          AND s.scheduled_start_at >= now()
      )                                                                AS next_session_at,
    CASE
      WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL AND c.location_point IS NOT NULL
        THEN ST_Distance(
               c.location_point,
               ST_MakePoint(p_lng, p_lat)::geography
             ) / 1000.0
      ELSE NULL
    END                                                                AS distance_km
  FROM  clubs c
  LEFT  JOIN club_memberships cm ON cm.club_id = c.id
  LEFT  JOIN sessions         s  ON s.club_id  = c.id
  WHERE
    c.status            = 'active'
    AND c.public_status = 'public'
    -- district filter
    AND (p_district   IS NULL OR c.district        = p_district)
    -- membership type filter
    AND (p_membership IS NULL OR c.membership_type = p_membership)
    -- skill level filter: club with empty skill_levels matches everything
    AND (
      p_skill IS NULL
      OR array_length(c.skill_levels, 1) IS NULL
      OR p_skill = ANY(c.skill_levels)
    )
    -- full-text search
    AND (
      p_search IS NULL
      OR c.fts @@ to_tsquery('simple', p_search || ':*')
    )
    -- GPS proximity filter: only apply when both lat/lng provided AND club has a point
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR c.location_point IS NULL
      OR ST_DWithin(
           c.location_point,
           ST_MakePoint(p_lng, p_lat)::geography,
           p_radius_km * 1000
         )
    )
  GROUP BY c.id
  ORDER BY
    -- 'nearest' sort: clubs without a location_point sort last
    CASE WHEN p_sort = 'nearest' AND p_lat IS NOT NULL AND p_lng IS NOT NULL
      THEN CASE
        WHEN c.location_point IS NOT NULL
          THEN ST_Distance(c.location_point, ST_MakePoint(p_lng, p_lat)::geography)
        ELSE 1e9
      END
    END ASC NULLS LAST,
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
-- 3b. count_public_clubs — mirrors WHERE conditions of get_public_clubs
-- ---------------------------------------------------------------
CREATE FUNCTION count_public_clubs(
  p_search      text   DEFAULT NULL,
  p_district    text   DEFAULT NULL,
  p_membership  text   DEFAULT NULL,
  p_skill       text   DEFAULT NULL,
  p_lat         float8 DEFAULT NULL,
  p_lng         float8 DEFAULT NULL,
  p_radius_km   float8 DEFAULT 5.0
)
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)
  FROM   clubs c
  WHERE
    c.status            = 'active'
    AND c.public_status = 'public'
    AND (p_district   IS NULL OR c.district        = p_district)
    AND (p_membership IS NULL OR c.membership_type = p_membership)
    AND (
      p_skill IS NULL
      OR array_length(c.skill_levels, 1) IS NULL
      OR p_skill = ANY(c.skill_levels)
    )
    AND (
      p_search IS NULL
      OR c.fts @@ to_tsquery('simple', p_search || ':*')
    )
    AND (
      p_lat IS NULL OR p_lng IS NULL
      OR c.location_point IS NULL
      OR ST_DWithin(
           c.location_point,
           ST_MakePoint(p_lng, p_lat)::geography,
           p_radius_km * 1000
         )
    );
$$;
