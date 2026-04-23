"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";
import { getSkillLabel } from "@/lib/constants/skills";
import type { ClubWithDiscovery } from "@/types/domain";

const TAIPEI_CENTER: [number, number] = [121.5654, 25.033];
const DEFAULT_ZOOM = 11;
const VECTOR_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  clubs: ClubWithDiscovery[];
  userLat?: number;
  userLng?: number;
};

type StyleLayer = {
  id?: string;
  type?: string;
  layout?: Record<string, unknown>;
};

type StyleDocument = StyleSpecification & {
  layers?: StyleLayer[];
};

export default function ClubMapView({ clubs, userLat, userLng }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const center: [number, number] =
      userLat != null && userLng != null ? [userLng, userLat] : TAIPEI_CENTER;

    const controller = new AbortController();
    let disposed = false;
    let activeMap: maplibregl.Map | null = null;

    const initMap = async () => {
      const style = await loadLocalizedVectorStyle(controller.signal);
      if (disposed || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center,
        zoom: DEFAULT_ZOOM,
        renderWorldCopies: false,
      });

      activeMap = map;
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      const addReferenceLabels = () => {
        addReferenceLabelLayers(map);
      };

      if (map.loaded()) {
        addReferenceLabels();
      } else {
        map.once("load", addReferenceLabels);
      }

      if (userLat != null && userLng != null) {
        new maplibregl.Marker({ element: createUserMarkerElement() })
          .setLngLat([userLng, userLat])
          .addTo(map);
      }

      clubs.forEach((club) => {
        if (club.distance_km == null && (userLat != null || userLng != null)) {
          return;
        }

        const coords = getDistrictCoords(club.district);
        if (!coords) return;

        new maplibregl.Marker({ element: createClubMarkerElement() })
          .setLngLat(coords)
          .setPopup(
            new maplibregl.Popup({ offset: 20, closeButton: false }).setHTML(
              buildClubPopupHtml(club)
            )
          )
          .addTo(map);
      });
    };

    void initMap();

    return () => {
      disposed = true;
      controller.abort();
      activeMap?.remove();
      mapRef.current = null;
    };
  }, [clubs, userLat, userLng]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 shadow-sm">
      <div ref={containerRef} style={{ height: "520px", width: "100%" }} />
      {clubs.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground">此範圍內沒有社團</p>
        </div>
      )}
    </div>
  );
}

async function loadLocalizedVectorStyle(signal: AbortSignal): Promise<string | StyleSpecification> {
  try {
    const response = await fetch(VECTOR_STYLE_URL, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load vector style: ${response.status}`);
    }

    const style = (await response.json()) as StyleDocument;
    return localizeStyle(style);
  } catch {
    return VECTOR_STYLE_URL;
  }
}

function localizeStyle(style: StyleDocument): StyleSpecification {
  if (!style.layers) return style;

  const layers = style.layers.map((layer) => {
    if (layer.type !== "symbol" || !layer.layout) {
      return layer;
    }

    const layerId = String(layer.id ?? "");
    const layout = { ...layer.layout };
    const hasTextField = Object.prototype.hasOwnProperty.call(layout, "text-field");

    if (!hasTextField) {
      return { ...layer, layout };
    }

    if (shouldHideLayer(layerId)) {
      layout.visibility = "none";
      return { ...layer, layout };
    }

    layout["text-field"] = traditionalChineseTextField();
    return { ...layer, layout };
  });

  return { ...style, layers };
}

function shouldHideLayer(layerId: string) {
  return (
    layerId.includes("poi") ||
    layerId.includes("housenumber") ||
    layerId.includes("building-number") ||
    layerId.includes("aeroway")
  );
}

function traditionalChineseTextField(): ExpressionSpecification {
  return [
    "coalesce",
    ["get", "name:zh-Hant"],
    ["get", "name:zh_Hant"],
    ["get", "name:zh-TW"],
    ["get", "name:zh"],
    ["get", "name"],
    ["get", "name:en"],
  ];
}

function addReferenceLabelLayers(map: maplibregl.Map) {
  if (!map.getSource("reference-pois")) {
    map.addSource("reference-pois", {
      type: "geojson",
      data: buildReferencePoiFeatureCollection(),
    });
  }

  if (!map.getSource("reference-localities")) {
    map.addSource("reference-localities", {
      type: "geojson",
      data: buildReferenceLocalityFeatureCollection(),
    });
  }

  if (!map.getLayer("reference-locality-labels")) {
    map.addLayer({
      id: "reference-locality-labels",
      type: "symbol",
      source: "reference-localities",
      minzoom: 8,
      maxzoom: 12.5,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 8, 12, 12, 15],
        "text-anchor": "center",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "symbol-sort-key": ["get", "priority"],
      },
      paint: {
        "text-color": "#334155",
        "text-halo-color": "rgba(255,255,255,0.98)",
        "text-halo-width": 1.8,
        "text-halo-blur": 0.8,
      },
    });
  }

  if (!map.getLayer("reference-poi-labels")) {
    map.addLayer({
      id: "reference-poi-labels",
      type: "symbol",
      source: "reference-pois",
      minzoom: 11,
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 11, 11, 14, 13],
        "text-offset": [0, 1.15],
        "text-anchor": "top",
        "text-letter-spacing": 0.01,
        "text-allow-overlap": false,
        "text-ignore-placement": false,
        "symbol-sort-key": ["get", "priority"],
      },
      paint: {
        "text-color": ["match", ["get", "kind"], "store", "#475569", "#334155"],
        "text-halo-color": "rgba(255,255,255,0.96)",
        "text-halo-width": 1.5,
        "text-halo-blur": 0.8,
      },
    });
  }
}

function createUserMarkerElement() {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 14px; height: 14px;
    background: #3b82f6; border: 2px solid #fff;
    border-radius: 50%; box-shadow: 0 0 0 4px rgba(59,130,246,0.25);
  `;
  return el;
}

function createClubMarkerElement() {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 36px; height: 36px;
    cursor: pointer;
  `;

  const pin = document.createElement("div");
  pin.style.cssText = `
    width: 36px; height: 36px;
    background: hsl(158 44% 20%);
    border: 2px solid #fff;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    transform-origin: center;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.15s;
  `;
  el.appendChild(pin);

  el.addEventListener("mouseenter", () => {
    pin.style.transform = "rotate(-45deg) scale(1.15)";
  });
  el.addEventListener("mouseleave", () => {
    pin.style.transform = "rotate(-45deg) scale(1)";
  });

  return el;
}

function buildClubPopupHtml(club: ClubWithDiscovery) {
  const skillHtml =
    club.skill_levels && club.skill_levels.length > 0
      ? club.skill_levels
          .map(
            (skill) =>
              `<span style="
                font-size:10px; font-weight:700; padding:1px 6px;
                border-radius:9999px; margin-right:3px;
                background:${skillBg(skill)}; color:${skillText(skill)};
              ">${getSkillLabel(skill)}</span>`
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

  return `
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
}

const DISTRICT_COORDS: Record<string, [number, number]> = {
  "中正區": [121.5195, 25.032],
  "大同區": [121.5136, 25.0629],
  "中山區": [121.5336, 25.0669],
  "松山區": [121.5777, 25.0499],
  "大安區": [121.5436, 25.0267],
  "萬華區": [121.4997, 25.0326],
  "信義區": [121.5674, 25.033],
  "士林區": [121.5241, 25.0931],
  "北投區": [121.5013, 25.132],
  "內湖區": [121.5874, 25.0831],
  "南港區": [121.6074, 25.0549],
  "文山區": [121.5674, 24.998],
  "新北市": [121.4647, 25.012],
  "其他": [121.5654, 25.033],
};

function getDistrictCoords(district: string | null): [number, number] | null {
  if (!district) return null;
  return DISTRICT_COORDS[district] ?? null;
}

function buildReferencePoiFeatureCollection() {
  return {
    type: "FeatureCollection" as const,
    features: REFERENCE_POIS.map((poi) => ({
      type: "Feature" as const,
      id: poi.id,
      geometry: {
        type: "Point" as const,
        coordinates: poi.coordinates,
      },
      properties: {
        name: poi.name,
        kind: poi.kind,
        priority: poi.priority,
      },
    })),
  };
}

function buildReferenceLocalityFeatureCollection() {
  return {
    type: "FeatureCollection" as const,
    features: REFERENCE_LOCALITIES.map((locality) => ({
      type: "Feature" as const,
      id: locality.id,
      geometry: {
        type: "Point" as const,
        coordinates: locality.coordinates,
      },
      properties: {
        name: locality.name,
        priority: locality.priority,
      },
    })),
  };
}

const REFERENCE_POIS = [
  {
    id: "taipei-101",
    name: "台北 101",
    kind: "landmark",
    priority: 1,
    coordinates: [121.5645, 25.0339] as [number, number],
  },
  {
    id: "sun-yat-sen-memorial-hall",
    name: "國父紀念館",
    kind: "landmark",
    priority: 2,
    coordinates: [121.5603, 25.0401] as [number, number],
  },
  {
    id: "daan-forest-park",
    name: "大安森林公園",
    kind: "landmark",
    priority: 3,
    coordinates: [121.5355, 25.0331] as [number, number],
  },
  {
    id: "taipei-arena",
    name: "台北小巨蛋",
    kind: "landmark",
    priority: 4,
    coordinates: [121.5505, 25.0515] as [number, number],
  },
  {
    id: "xinyi-sports-center",
    name: "信義運動中心",
    kind: "store",
    priority: 5,
    coordinates: [121.5664, 25.0318] as [number, number],
  },
  {
    id: "daan-sports-center",
    name: "大安運動中心",
    kind: "store",
    priority: 6,
    coordinates: [121.5348, 25.0245] as [number, number],
  },
  {
    id: "neihu-pickleball-center",
    name: "內湖匹克球中心",
    kind: "store",
    priority: 7,
    coordinates: [121.5862, 25.0814] as [number, number],
  },
  {
    id: "zhongshan-sports-center",
    name: "中山運動中心",
    kind: "store",
    priority: 8,
    coordinates: [121.5249, 25.0565] as [number, number],
  },
] as const;

const REFERENCE_LOCALITIES = [
  {
    id: "taipei-city",
    name: "臺北市",
    priority: 1,
    coordinates: [121.5654, 25.033] as [number, number],
  },
  {
    id: "new-taipei-city",
    name: "新北市",
    priority: 2,
    coordinates: [121.4628, 25.0169] as [number, number],
  },
  {
    id: "keelung-city",
    name: "基隆市",
    priority: 3,
    coordinates: [121.7462, 25.1319] as [number, number],
  },
  {
    id: "taoyuan-city",
    name: "桃園市",
    priority: 4,
    coordinates: [121.301, 24.9936] as [number, number],
  },
  {
    id: "dayuan-district",
    name: "大園區",
    priority: 5,
    coordinates: [121.1951, 25.0647] as [number, number],
  },
  {
    id: "sanchong-district",
    name: "三重區",
    priority: 6,
    coordinates: [121.488, 25.0615] as [number, number],
  },
  {
    id: "banqiao-district",
    name: "板橋區",
    priority: 7,
    coordinates: [121.4627, 25.0119] as [number, number],
  },
  {
    id: "xindian-district",
    name: "新店區",
    priority: 8,
    coordinates: [121.5319, 24.9676] as [number, number],
  },
] as const;

function skillBg(value: string): string {
  const map: Record<string, string> = {
    beginner: "#dcfce7",
    intermediate: "#dbeafe",
    advanced: "#ffedd5",
    pro: "#fee2e2",
  };
  return map[value] ?? "#f3f4f6";
}

function skillText(value: string): string {
  const map: Record<string, string> = {
    beginner: "#166534",
    intermediate: "#1e40af",
    advanced: "#9a3412",
    pro: "#991b1b",
  };
  return map[value] ?? "#374151";
}
