"use client";

import { useEffect } from "react";
import {
  WIREFRAME_LABELS_STORAGE_KEY,
  WIREFRAME_STORAGE_KEY,
  applyWireframeClass,
  applyWireframeLabels,
  applyTypographyLabels,
  readWireframeLabelsPreference,
  readWireframePreference,
  readTypographyLabelsPreference,
  TYPOGRAPHY_LABELS_STORAGE_KEY,
} from "@/lib/wireframe-mode";

export default function WireframeModeHydrator() {
  useEffect(() => {
    let isWireframeEnabled = readWireframePreference(false);
    let labelsPreference = readWireframeLabelsPreference(false);
    let typographyPreference = readTypographyLabelsPreference(false);

    applyWireframeClass(isWireframeEnabled);
    applyWireframeLabels(isWireframeEnabled && labelsPreference);
    applyTypographyLabels(isWireframeEnabled && typographyPreference);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WIREFRAME_STORAGE_KEY) {
        isWireframeEnabled = event.newValue === "true";
        applyWireframeClass(isWireframeEnabled);
        applyWireframeLabels(isWireframeEnabled && labelsPreference);
        applyTypographyLabels(isWireframeEnabled && typographyPreference);
        return;
      }

      if (event.key === WIREFRAME_LABELS_STORAGE_KEY) {
        labelsPreference = event.newValue === "true";
        applyWireframeLabels(isWireframeEnabled && labelsPreference);
      }

      if (event.key === TYPOGRAPHY_LABELS_STORAGE_KEY) {
        typographyPreference = event.newValue === "true";
        applyTypographyLabels(isWireframeEnabled && typographyPreference);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}

