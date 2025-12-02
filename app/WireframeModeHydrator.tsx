"use client";

import { useEffect } from "react";
import {
  WIREFRAME_LABELS_STORAGE_KEY,
  WIREFRAME_STORAGE_KEY,
  applyWireframeClass,
  applyWireframeLabels,
  readWireframeLabelsPreference,
  readWireframePreference,
} from "@/lib/wireframe-mode";

export default function WireframeModeHydrator() {
  useEffect(() => {
    let isWireframeEnabled = readWireframePreference(false);
    let labelsPreference = readWireframeLabelsPreference(false);

    applyWireframeClass(isWireframeEnabled);
    applyWireframeLabels(isWireframeEnabled && labelsPreference);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WIREFRAME_STORAGE_KEY) {
        isWireframeEnabled = event.newValue === "true";
        applyWireframeClass(isWireframeEnabled);
        applyWireframeLabels(isWireframeEnabled && labelsPreference);
        return;
      }

      if (event.key === WIREFRAME_LABELS_STORAGE_KEY) {
        labelsPreference = event.newValue === "true";
        applyWireframeLabels(isWireframeEnabled && labelsPreference);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}

