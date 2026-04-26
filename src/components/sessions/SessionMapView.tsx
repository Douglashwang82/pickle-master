"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { StyleSpecification } from "maplibre-gl";
import { format } from "date-fns";
import type { PublicSession } from "@/types/domain";

const TAIPEI_CENTER: [number, number] = [121.5654, 25.033];
const DEFAULT_ZOOM = 11;
const VECTOR_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

type Props = {
  sessions: PublicSession[];
};

export default function SessionMapView({ sessions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let activeMap: maplibregl.Map | null = null;
    let disposed = false;

    const initMap = async () => {
      const style = await loadVectorStyle();
      if (!containerRef.current || disposed) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        center: TAIPEI_CENTER,
        zoom: DEFAULT_ZOOM,
        renderWorldCopies: false,
      });

      activeMap = map;
      map.addControl(new maplibregl.NavigationControl(), "top-right");

      sessions.forEach((session, index) => {
        const coords = getDistrictCoords(session.club_district);
        if (!coords) return;

        const jitteredCoords: [number, number] = [
          coords[0] + ((index % 3) - 1) * 0.004,
          coords[1] + ((index % 4) - 1.5) * 0.003,
        ];

        new maplibregl.Marker({ element: createSessionMarkerElement(session.available_spots <= 0) })
          .setLngLat(jitteredCoords)
          .setPopup(
            new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(
              buildSessionPopupHtml(session)
            )
          )
          .addTo(map);
      });
    };

    void initMap();

    return () => {
      disposed = true;
      activeMap?.remove();
    };
  }, [sessions]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border/40 shadow-sm">
      <div ref={containerRef} style={{ width: "100%", height: "520px" }} />
      {sessions.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <p className="text-sm font-medium text-muted-foreground">此範圍內沒有場次</p>
        </div>
      ) : null}
    </div>
  );
}

async function loadVectorStyle(): Promise<string | StyleSpecification> {
  try {
    const response = await fetch(VECTOR_STYLE_URL);
    if (!response.ok) throw new Error("Failed to load vector style");
    return (await response.json()) as StyleSpecification;
  } catch {
    return VECTOR_STYLE_URL;
  }
}

function createSessionMarkerElement(isFull: boolean) {
  const element = document.createElement("div");
  element.style.cssText = `
    width: 18px;
    height: 18px;
    border-radius: 9999px;
    border: 3px solid white;
    background: ${isFull ? "#dc2626" : "hsl(158 44% 20%)"};
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.24);
    cursor: pointer;
  `;
  return element;
}

function buildSessionPopupHtml(session: PublicSession) {
  const isFull = session.available_spots <= 0;

  return `
    <div style="max-width:240px;font-family:sans-serif;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:800;">${session.title}</p>
      <p style="margin:0 0 6px;font-size:12px;color:#334155;font-weight:700;">${session.club_name}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#475569;">${format(new Date(session.scheduled_start_at), "PPP p")}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#475569;">📍 ${session.location_name}</p>
      <p style="margin:0 0 6px;font-size:12px;color:#475569;">
        ${isFull ? "已額滿" : `剩餘 ${session.available_spots} 個名額`}
        &nbsp;·&nbsp;
        ${session.fee_twd > 0 ? `NT$${session.fee_twd}` : "免費"}
      </p>
      <a href="/sessions/${session.id}"
         style="display:inline-block;margin-top:4px;border-radius:9999px;background:hsl(158 44% 20%);padding:5px 12px;color:#fff;text-decoration:none;font-size:12px;font-weight:700;">
        查看場次 →
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
