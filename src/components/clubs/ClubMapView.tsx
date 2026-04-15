"use client";

import { useEffect, useRef } from "react";
import type { ClubWithDiscovery } from "@/types/domain";
import { getSkillLabel, getSkillColor } from "@/lib/constants/skills";

// MapLibre is loaded client-side only (no SSR).
// Import here — Next.js dynamic() in the parent handles SSR suppression.
import maplibregl from "maplibre-gl";

// Taipei city centre — default map centre when no GPS filter is active
const TAIPEI_CENTER: [number, number] = [121.5654, 25.033];
const DEFAULT_ZOOM = 11;

type Props = {
  clubs: ClubWithDiscovery[];
  /** User GPS coordinates — map re-centres here when provided */
  userLat?: number;
  userLng?: number;
};

export default function ClubMapView({ clubs, userLat, userLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const centre: [number, number] =
      userLat != null && userLng != null
        ? [userLng, userLat]
        : TAIPEI_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      // Free OSM raster tiles — no API key required
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [{ id: "osm-layer", type: "raster", source: "osm" }],
      },
      center: centre,
      zoom: DEFAULT_ZOOM,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // User location marker (blue dot)
    if (userLat != null && userLng != null) {
      const el = document.createElement("div");
      el.style.cssText = `
        width: 14px; height: 14px;
        background: #3b82f6; border: 2px solid #fff;
        border-radius: 50%; box-shadow: 0 0 0 4px rgba(59,130,246,0.25);
      `;
      new maplibregl.Marker({ element: el })
        .setLngLat([userLng, userLat])
        .addTo(map);
    }

    // Club markers
    clubs.forEach((club) => {
      // Skip clubs without a stored location_point.
      // The RPC returns distance_km only when the club has a point set;
      // we use that as a proxy — clubs without coords won't have a lat/lng
      // in the response, so we skip them for the map view.
      // (In a future iteration, club lat/lng can be included in the RPC return.)
      if (club.distance_km == null && (userLat != null || userLng != null)) {
        // When GPS filter is active, clubs without coordinates are still shown
        // in the list but we can't pin them on the map — skip silently.
        return;
      }

      // For the map demo, place clubs at the district centroid if no exact
      // coordinates are present. District centroids are approximate.
      const coords = getDistrictCoords(club.district);
      if (!coords) return;

      // Custom marker element
      const el = document.createElement("div");
      el.style.cssText = `
        width: 36px; height: 36px;
        background: hsl(158 44% 20%);
        border: 2px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.15s;
      `;
      el.addEventListener("mouseenter", () => {
        el.style.transform = "rotate(-45deg) scale(1.15)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "rotate(-45deg) scale(1)";
      });

      // Popup content
      const skillHtml =
        club.skill_levels && club.skill_levels.length > 0
          ? club.skill_levels
              .map(
                (s) =>
                  `<span style="
                    font-size:10px; font-weight:700; padding:1px 6px;
                    border-radius:9999px; margin-right:3px;
                    background:${skillBg(s)}; color:${skillText(s)};
                  ">${getSkillLabel(s)}</span>`
              )
              .join("")
          : "";

      const membershipBadge =
        club.membership_type === "open"
          ? `<span style="font-size:10px;font-weight:700;color:#166534;background:#dcfce7;padding:1px 6px;border-radius:9999px;">公開加入</span>`
          : `<span style="font-size:10px;font-weight:700;color:#374151;background:#f3f4f6;padding:1px 6px;border-radius:9999px;">需申請</span>`;

      const distanceLine =
        club.distance_km != null
          ? `<p style="font-size:11px;color:#6b7280;margin:2px 0 0">📍 ${
              club.distance_km < 1
                ? `${Math.round(club.distance_km * 1000)} m`
                : `${club.distance_km.toFixed(1)} km`
            } 遠</p>`
          : "";

      const popupHtml = `
        <div style="max-width:220px;font-family:sans-serif;">
          <p style="font-weight:800;font-size:14px;margin:0 0 4px">${club.name}</p>
          <div style="margin-bottom:4px;">${membershipBadge} ${skillHtml}</div>
          <p style="font-size:11px;color:#6b7280;margin:0;">
            👥 ${club.member_count} 位成員
            ${club.upcoming_session_count > 0 ? `&nbsp;·&nbsp;📅 ${club.upcoming_session_count} 場` : ""}
          </p>
          ${distanceLine}
          <a href="/clubs/${club.slug}"
            style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;
                   color:#fff;background:hsl(158 44% 20%);padding:4px 12px;
                   border-radius:9999px;text-decoration:none;">
            查看社團 →
          </a>
        </div>
      `;

      new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .setPopup(
          new maplibregl.Popup({ offset: 20, closeButton: false })
            .setHTML(popupHtml)
        )
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [clubs, userLat, userLng]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border/40 shadow-sm">
      <div ref={containerRef} style={{ height: "520px", width: "100%" }} />
      {clubs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
          <p className="text-sm text-muted-foreground font-medium">此範圍內沒有社團</p>
        </div>
      )}
    </div>
  );
}

// Approximate centroid for each Taipei district (WGS-84 lon, lat)
const DISTRICT_COORDS: Record<string, [number, number]> = {
  "中正區": [121.5195, 25.0320],
  "大同區": [121.5136, 25.0629],
  "中山區": [121.5336, 25.0669],
  "松山區": [121.5777, 25.0499],
  "大安區": [121.5436, 25.0267],
  "萬華區": [121.4997, 25.0326],
  "信義區": [121.5674, 25.0330],
  "士林區": [121.5241, 25.0931],
  "北投區": [121.5013, 25.1320],
  "內湖區": [121.5874, 25.0831],
  "南港區": [121.6074, 25.0549],
  "文山區": [121.5674, 24.9980],
  "新北市": [121.4647, 25.0120],
  "其他":   [121.5654, 25.0330],
};

function getDistrictCoords(district: string | null): [number, number] | null {
  if (!district) return null;
  return DISTRICT_COORDS[district] ?? null;
}

// Inline colour helpers for popup HTML (can't reference Tailwind classes in innerHTML)
function skillBg(value: string): string {
  const map: Record<string, string> = {
    beginner: "#dcfce7", intermediate: "#dbeafe",
    advanced: "#ffedd5", pro: "#fee2e2",
  };
  return map[value] ?? "#f3f4f6";
}

function skillText(value: string): string {
  const map: Record<string, string> = {
    beginner: "#166534", intermediate: "#1e40af",
    advanced: "#9a3412", pro: "#991b1b",
  };
  return map[value] ?? "#374151";
}
