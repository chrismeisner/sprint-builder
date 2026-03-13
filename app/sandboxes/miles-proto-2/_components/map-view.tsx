"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export interface MapMarker {
  lat: number;
  lng: number;
  /** "start" = hollow ring, "end" = filled dot, "event" = red pulse, "vehicle" = car badge */
  type?: "start" | "end" | "event" | "vehicle";
  /** Optional badge label rendered above the dot */
  label?: string;
  /** Override dot fill color (hex/css) */
  color?: string;
}

export interface MapViewProps {
  /** Array of [lat, lng] pairs forming the route polyline */
  route?: [number, number][];
  /** Point markers to show on the map */
  markers?: MapMarker[];
  /** Map center — auto-derived from route/markers if omitted */
  center?: [number, number];
  /** Zoom level — auto-fit to route bounds if omitted */
  zoom?: number;
  /** Disable all interaction (pan/zoom/scroll). Good for thumbnails. */
  interactive?: boolean;
  /** Route line color. Defaults to #2563eb (blue-600). */
  routeColor?: string;
  /** Route line weight in px. Defaults to 3. */
  routeWeight?: number;
  /** Extra CSS classes on the wrapper div */
  className?: string;
}

function markerIcon(Leaf: typeof L, type: MapMarker["type"] = "end", color?: string, label?: string): L.DivIcon {
  if (type === "vehicle") {
    const vehicleColor = color ?? "#16a34a";

    return Leaf.divIcon({
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      html: `<div style="width:24px;height:24px;background:${vehicleColor};border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.5 16.5h9m-11.21-1.35.73-2.9a2.25 2.25 0 0 1 2.18-1.7h7.6a2.25 2.25 0 0 1 2.18 1.7l.73 2.9M6 16.5v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75m7.5 0v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75M7.5 16.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>`,
    });
  }

  const dotColor = color ?? (type === "start" ? "white" : type === "event" ? "#ef4444" : "#2563eb");
  const borderColor = type === "start" ? (color ?? "#3b82f6") : "white";
  const dotSize = type === "event" ? 16 : 14;
  const dotHtml = `<div style="width:${dotSize}px;height:${dotSize}px;background:${dotColor};border-radius:9999px;border:2.5px solid ${borderColor};box-shadow:0 1px 4px rgba(0,0,0,.25);flex-shrink:0;"></div>`;

  if (label) {
    // Badge floats above the dot, both centered in a column
    const html = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="background:${dotColor};color:white;border-radius:9999px;padding:3px 8px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.2);font-family:system-ui,-apple-system,sans-serif;line-height:1.4;">${label}</div>
      ${dotHtml}
    </div>`;
    // Container is wide enough for the badge; anchor at dot center (bottom of container minus half dot)
    return Leaf.divIcon({
      className: "",
      iconSize: [110, 38],
      iconAnchor: [55, 31],
      html,
    });
  }

  return Leaf.divIcon({
    className: "",
    iconSize: [dotSize, dotSize],
    iconAnchor: [dotSize / 2, dotSize / 2],
    html: dotHtml,
  });
}


export function MapView({
  route,
  markers,
  center,
  zoom,
  interactive = true,
  routeColor = "#2563eb",
  routeWeight = 3,
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    if (mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((Leaf) => {
      if (cancelled || !containerRef.current) return;

      const fallbackCenter: [number, number] = center ?? [37.78, -122.42];
      const fallbackZoom = zoom ?? 13;

      const map = Leaf.map(containerRef.current!, {
        center: fallbackCenter,
        zoom: fallbackZoom,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });

      Leaf.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        maxZoom: 19,
        detectRetina: true,
      }).addTo(map);

      if (route && route.length >= 2) {
        const polyline = Leaf.polyline(route, {
          color: routeColor,
          weight: routeWeight,
          opacity: 0.9,
          smoothFactor: 1.5,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);

        if (!center && !zoom) {
          map.fitBounds(polyline.getBounds(), { padding: [28, 28] });
        }
      }

      if (markers && markers.length > 0) {
        const bounds = Leaf.latLngBounds([]);
        for (const m of markers) {
          Leaf.marker([m.lat, m.lng], { icon: markerIcon(Leaf, m.type, m.color, m.label), interactive: false }).addTo(map);
          bounds.extend([m.lat, m.lng]);
        }
        if (!route && !center && !zoom) {
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
        }
      }

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        ref={containerRef}
        className={`z-0 bg-neutral-100 ${className}`}
        style={{ width: "100%", height: "100%" }}
      />
    </>
  );
}
