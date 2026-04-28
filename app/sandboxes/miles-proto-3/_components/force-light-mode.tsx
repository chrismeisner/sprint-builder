"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "miles-proto-3-force-light";

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
    if (forceLight) {
      html.classList.remove("dark");
    } else {
      html.classList.add("dark");
    }
    return () => { html.classList.remove("dark"); };
  }, [forceLight]);

  return null;
}
