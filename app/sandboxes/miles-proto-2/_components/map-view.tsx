"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

/* ------------------------------------------------------------------ */
/*  iOS translation reference                                          */
/*                                                                     */
/*  MapView → MKMapView (MapKit) or Map (SwiftUI)                      */
/*  mapStyle → MKMapType / MapStyle                                    */
/*  markers  → MKAnnotation / MapAnnotation                            */
/*  route    → MKPolyline overlay                                      */
/*  fitBounds → map.showAnnotations(_:animated:)                       */
/*  interactive=false → isUserInteractionEnabled = false               */
/* ------------------------------------------------------------------ */

export interface MapMarker {
  lat: number;
  lng: number;
  type?: "start" | "end" | "event" | "vehicle";
  label?: string;
  color?: string;
  /** Override the label pill background independently from the marker dot/circle color */
  labelColor?: string;
  initial?: string;
  imageSrc?: string;
  /** Overlapping avatar (e.g. vehicle) shown bottom-right on top of imageSrc — trip list / todo style */
  overlayImageSrc?: string;
  /** Overlapping initial badge (solid color circle with letter) shown bottom-right on top of imageSrc */
  overlayInitial?: string;
  overlayColor?: string;
  carIcon?: boolean;
}

export interface MapViewProps {
  route?: [number, number][];
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  routeColor?: string;
  routeWeight?: number;
  mapStyle?: string;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Marker DOM builder                                                 */
/* ------------------------------------------------------------------ */

function createMarkerElement(m: MapMarker): HTMLDivElement {
  const type = m.type ?? "end";
  const color = m.color ?? (type === "start" ? "white" : type === "event" ? "#ef4444" : "#2563eb");
  const borderColor = type === "start" ? (m.color ?? "#3b82f6") : "white";

  if (type === "vehicle") {
    const el = document.createElement("div");
    el.innerHTML = `<div style="width:24px;height:24px;background:${m.color ?? "#16a34a"};border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7.5 16.5h9m-11.21-1.35.73-2.9a2.25 2.25 0 0 1 2.18-1.7h7.6a2.25 2.25 0 0 1 2.18 1.7l.73 2.9M6 16.5v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75m7.5 0v.75a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75v-.75M7.5 16.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>`;
    return el;
  }

  const hasPhoto = !!m.imageSrc;
  const hasOverlay = !!m.overlayImageSrc || !!m.overlayInitial;
  const hasAvatar = !!(m.initial || m.imageSrc || m.carIcon);
  /* Initial + label pill (e.g. fleet “Parked”) should match the main circle size of photo + overlay markers (e.g. “Driving”). */
  const largeInitialWithLabel = !!(m.initial && m.label && !m.imageSrc && !m.carIcon);
  const avatarSize = hasPhoto
    ? 56
    : m.carIcon
      ? 40
      : largeInitialWithLabel
        ? 56
        : hasAvatar
          ? 28
          : type === "event"
            ? 16
            : 14;
  const borderW = hasPhoto || largeInitialWithLabel ? 3 : 2.5;

  let avatarHtml: string;
  if (m.carIcon) {
    const carSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    avatarHtml = `<div style="width:${avatarSize}px;height:${avatarSize}px;background:${color};border-radius:9999px;border:${borderW}px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);flex-shrink:0;display:flex;align-items:center;justify-content:center;">${carSvg}</div>`;
  } else if (m.imageSrc && hasOverlay) {
    /* Trip-active style: large profile avatar + vehicle overlay circle (recent trips / todo style) */
    const overlaySize = 28;
    const overlayOffset = -4;
    const overlayBadge = m.overlayInitial
      ? `<div style="position:absolute;right:${overlayOffset}px;bottom:${overlayOffset}px;width:${overlaySize}px;height:${overlaySize}px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25);background:${m.overlayColor ?? color};display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;line-height:1;">${m.overlayInitial}</div>`
      : `<div style="position:absolute;right:${overlayOffset}px;bottom:${overlayOffset}px;width:${overlaySize}px;height:${overlaySize}px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.25);overflow:hidden;background:#e5e7eb;"><img src="${m.overlayImageSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
    avatarHtml = `<div style="position:relative;display:inline-flex;flex-shrink:0;">
      <div style="width:${avatarSize}px;height:${avatarSize}px;border-radius:9999px;border:${borderW}px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);overflow:hidden;"><img src="${m.imageSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>
      ${overlayBadge}
    </div>`;
  } else if (m.imageSrc) {
    avatarHtml = `<div style="width:${avatarSize}px;height:${avatarSize}px;border-radius:9999px;border:${borderW}px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);flex-shrink:0;overflow:hidden;"><img src="${m.imageSrc}" style="width:100%;height:100%;object-fit:cover;" /></div>`;
  } else if (m.initial) {
    const initialFontSize = largeInitialWithLabel ? 22 : 11;
    const initialShadow = largeInitialWithLabel ? "0 2px 8px rgba(0,0,0,.3)" : "0 1px 4px rgba(0,0,0,.25)";
    avatarHtml = `<div style="width:${avatarSize}px;height:${avatarSize}px;background:${color};border-radius:9999px;border:${borderW}px solid white;box-shadow:${initialShadow};flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-size:${initialFontSize}px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;line-height:1;">${m.initial}</div>`;
  } else {
    avatarHtml = `<div style="width:${avatarSize}px;height:${avatarSize}px;background:${color};border-radius:9999px;border:2.5px solid ${borderColor};box-shadow:0 1px 4px rgba(0,0,0,.25);flex-shrink:0;"></div>`;
  }

  const el = document.createElement("div");
  if (m.label) {
    const labelFontSize = hasPhoto ? 11 : 10;
    const labelPad = hasPhoto ? "4px 10px" : "3px 8px";
    const gap = hasPhoto ? 6 : 4;
    const pillColor = m.labelColor ?? color;
    el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:${gap}px;pointer-events:none;">
      <div style="background:${pillColor};color:white;border-radius:9999px;padding:${labelPad};font-size:${labelFontSize}px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.2);font-family:system-ui,-apple-system,sans-serif;line-height:1.4;letter-spacing:0.03em;text-transform:uppercase;">${m.label}</div>
      ${avatarHtml}
    </div>`;
  } else {
    el.innerHTML = avatarHtml;
  }
  return el;
}

/* ------------------------------------------------------------------ */
/*  MapView component                                                  */
/* ------------------------------------------------------------------ */

const DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";

export function MapView({
  route,
  markers,
  center,
  zoom,
  interactive = true,
  routeColor = "#2563eb",
  routeWeight = 3,
  mapStyle = DEFAULT_STYLE,
  className = "",
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !MAPBOX_TOKEN) return;

    function initMap() {
      if (mapRef.current || !el) return;

      mapboxgl.accessToken = MAPBOX_TOKEN!;

      /* Pre-compute initial center from markers / route so the map never
         starts at a distant fallback and then animates across the globe. */
      const allLngLats: [number, number][] = [];
      if (markers && markers.length > 0) {
        for (const m of markers) allLngLats.push([m.lng, m.lat]);
      }
      if (route && route.length >= 2) {
        for (const [lat, lng] of route) allLngLats.push([lng, lat]);
      }

      let initCenter: [number, number];
      let initZoom: number;

      if (center) {
        initCenter = [center[1], center[0]];
        initZoom = zoom ?? 13;
      } else if (allLngLats.length > 0) {
        const bounds = allLngLats.reduce(
          (b, coord) => b.extend(coord),
          new mapboxgl.LngLatBounds(allLngLats[0], allLngLats[0])
        );
        const c = bounds.getCenter();
        initCenter = [c.lng, c.lat];
        initZoom = zoom ?? 12;
      } else {
        initCenter = [-96.7108, 33.0152];
        initZoom = zoom ?? 13;
      }

      const map = new mapboxgl.Map({
        container: el,
        style: mapStyle,
        center: initCenter,
        zoom: initZoom,
        attributionControl: false,
        interactive,
      });

      map.on("load", () => {
        map.resize();
        if (route && route.length >= 2) {
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "LineString",
              coordinates: route.map(([lat, lng]) => [lng, lat]),
            } as GeoJSON.LineString,
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": routeColor,
              "line-width": routeWeight,
              "line-opacity": 0.9,
            },
          });
        }

        if (markers && markers.length > 0) {
          for (const m of markers) {
            const elMarker = createMarkerElement(m);
            const marker = new mapboxgl.Marker({ element: elMarker })
              .setLngLat([m.lng, m.lat])
              .addTo(map);
            markersRef.current.push(marker);
          }
        }

        if (!center && !zoom && allLngLats.length > 0) {
          const bounds = allLngLats.reduce(
            (b, coord) => b.extend(coord),
            new mapboxgl.LngLatBounds(allLngLats[0], allLngLats[0])
          );
          map.fitBounds(bounds, { padding: 40, maxZoom: 15, animate: false });
        }
      });

      mapRef.current = map;
    }

    /* Use a ResizeObserver to wait until the container has non-zero dimensions
       before initialising Mapbox — avoids the 0×0 canvas problem that occurs
       when the element uses absolute/inset-0 and layout hasn't painted yet. */
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        if (!mapRef.current) {
          initMap();
        } else {
          mapRef.current.resize();
        }
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Outer shell owns the absolute positioning / sizing; inner div is the
     Mapbox container so ResizeObserver always sees real content dimensions. */
  return (
    <div className={`absolute inset-0 z-0 [&_.mapboxgl-ctrl-logo]:!hidden ${className}`}>
      <div ref={containerRef} className="h-full w-full bg-neutral-100" />
    </div>
  );
}
