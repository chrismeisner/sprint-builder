"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "miles-proto-1-force-light";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("miles-theme-change", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("miles-theme-change", cb);
  };
}

function getSnapshot(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

function getServerSnapshot(): boolean {
  return true;
}

export function useForceLightMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setForceLightMode(value: boolean) {
  localStorage.setItem(STORAGE_KEY, String(value));
  window.dispatchEvent(new Event("miles-theme-change"));
}

export function ForceLightMode() {
  const forceLight = useForceLightMode();

  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");

    if (forceLight) {
      html.classList.remove("dark");
    } else if (wasDark || window.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
    }

    return () => {
      if (wasDark) html.classList.add("dark");
      else html.classList.remove("dark");
    };
  }, [forceLight]);

  return null;
}
