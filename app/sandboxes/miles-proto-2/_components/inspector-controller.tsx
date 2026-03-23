"use client";

import { useEffect, useState } from "react";
import { TextInspector } from "./text-inspector";
import { LayerInspector } from "./layer-inspector";

type ActiveInspector = "text" | "layer" | null;

export function InspectorController() {
  const [active, setActive] = useState<ActiveInspector>(null);

  // Override cursor while any inspector is active so Mapbox's grab cursor doesn't show
  useEffect(() => {
    const id = "inspector-cursor-override";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (active) {
      if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
      }
      el.textContent = [
        "* { cursor: crosshair !important; }",
        // Disable Mapbox pan/zoom while inspecting
        ".mapboxgl-canvas-container, .mapboxgl-canvas { pointer-events: none !important; }",
        // Re-enable pointer events inside HTML markers so elementFromPoint can
        // reach the actual badge/text divs (which normally have pointer-events:none)
        ".mapboxgl-marker * { pointer-events: auto !important; }",
      ].join("\n");
    } else {
      el?.remove();
    }
    return () => { document.getElementById(id)?.remove(); };
  }, [active]);

  // Keyboard shortcuts — T for text, L for layer, V to pin, X to clear all pins
  // (V and X are handled inside each inspector). Pressing T/L again turns it off.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

        const key = e.key.toLowerCase();
        if (e.key === "Escape") {
          e.preventDefault();
          setActive(null);
        } else if (key === "t") {
          e.preventDefault();
          setActive((v) => (v === "text" ? null : "text"));
        } else if (key === "l") {
          e.preventDefault();
          setActive((v) => (v === "layer" ? null : "layer"));
        }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <TextInspector
        active={active === "text"}
        onToggle={() => setActive((v) => (v === "text" ? null : "text"))}
      />
      <LayerInspector
        active={active === "layer"}
        onToggle={() => setActive((v) => (v === "layer" ? null : "layer"))}
      />
    </>
  );
}
