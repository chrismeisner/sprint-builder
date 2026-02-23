"use client";

import { useEffect, useRef, useState } from "react";
import type L from "leaflet";

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

export interface MapMarker {
  lat: number;
  lng: number;
  /** "start" = hollow ring, "end" = filled dot, "event" = red pulse */
  type?: "start" | "end" | "event";
  label?: string;
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

function markerIcon(Leaf: typeof L, type: MapMarker["type"] = "end"): L.DivIcon {
  const shared = "position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:9999px;";

  if (type === "start") {
    return Leaf.divIcon({
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      html: `<span style="${shared}width:14px;height:14px;background:white;border:2.5px solid #3b82f6;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span>`,
    });
  }

  if (type === "event") {
    return Leaf.divIcon({
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      html: `<span style="${shared}width:16px;height:16px;background:#ef4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25);"></span>`,
    });
  }

  return Leaf.divIcon({
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<span style="${shared}width:14px;height:14px;background:#2563eb;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span>`,
  });
}

function isDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches;
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

      const dark = isDarkMode();
      const tileUrl = dark ? TILES.dark : TILES.light;

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

      Leaf.tileLayer(tileUrl, {
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
          Leaf.marker([m.lat, m.lng], { icon: markerIcon(Leaf, m.type), interactive: false }).addTo(map);
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
        className={`z-0 bg-neutral-100 dark:bg-neutral-800 ${className}`}
        style={{ width: "100%", height: "100%" }}
      />
    </>
  );
}
