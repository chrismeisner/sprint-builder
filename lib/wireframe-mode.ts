import {
  getTypographyClassName,
  type TypographyScaleId,
} from "@/lib/design-system/typography-classnames";
import { typographyScale } from "@/lib/design-system/tokens";

export const WIREFRAME_STORAGE_KEY = "wireframeModeEnabled";
export const WIREFRAME_LABELS_STORAGE_KEY = "wireframeLabelsEnabled";
export const TYPOGRAPHY_LABELS_STORAGE_KEY = "typographyLabelsEnabled";

const DOM_TARGETS = () => {
  if (typeof document === "undefined") return [];
  return [document.documentElement, document.body].filter(
    (node): node is HTMLElement => Boolean(node)
  );
};

/**
 * Adds or removes the global wireframe CSS hook classes.
 */
export function applyWireframeClass(enabled: boolean) {
  DOM_TARGETS().forEach((target) =>
    target.classList.toggle("wireframe-mode", enabled)
  );
}

export function readWireframePreference(defaultValue = false) {
  if (typeof window === "undefined") return defaultValue;

  const stored = window.localStorage.getItem(WIREFRAME_STORAGE_KEY);
  if (stored === null) return defaultValue;

  return stored === "true";
}

export function persistWireframePreference(enabled: boolean) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(WIREFRAME_STORAGE_KEY, String(enabled));
}

export function readWireframeLabelsPreference(defaultValue = false) {
  if (typeof window === "undefined") return defaultValue;
  const stored = window.localStorage.getItem(WIREFRAME_LABELS_STORAGE_KEY);
  if (stored === null) return defaultValue;
  return stored === "true";
}

export function persistWireframeLabelsPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WIREFRAME_LABELS_STORAGE_KEY, String(enabled));
}

let wireframeLabelObserver: MutationObserver | null = null;
let typographyLabelObserver: MutationObserver | null = null;

const TYPOGRAPHY_TARGET_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, span, div, a, li, code, label";

const typographySignatures = typographyScale.map((token) => ({
  id: token.id as TypographyScaleId,
  classTokens: getTypographyClassName(token.id as TypographyScaleId)
    .split(/\s+/)
    .filter(Boolean),
}));

export function readTypographyLabelsPreference(defaultValue = false) {
  if (typeof window === "undefined") return defaultValue;
  const stored = window.localStorage.getItem(TYPOGRAPHY_LABELS_STORAGE_KEY);
  if (stored === null) return defaultValue;
  return stored === "true";
}

export function persistTypographyLabelsPreference(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TYPOGRAPHY_LABELS_STORAGE_KEY, String(enabled));
}

export function applyWireframeLabels(enabled: boolean) {
  DOM_TARGETS().forEach((target) =>
    target.classList.toggle("wireframe-labels", enabled)
  );

  if (typeof document === "undefined") return;

  if (enabled) {
    updateAllDivLabels(true);
    ensureLabelObserver();
  } else {
    updateAllDivLabels(false);
    teardownLabelObserver();
  }
}

export function applyTypographyLabels(enabled: boolean) {
  DOM_TARGETS().forEach((target) =>
    target.classList.toggle("typography-label-mode", enabled)
  );

  if (typeof document === "undefined") return;

  if (enabled) {
    annotateAllTypographyNodes();
    ensureTypographyLabelObserver();
  } else {
    cleanupAutoTypographyLabels();
    teardownTypographyLabelObserver();
  }
}

function ensureLabelObserver() {
  if (wireframeLabelObserver || typeof MutationObserver === "undefined") return;
  const body = document.body;
  if (!body) return;

  wireframeLabelObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.tagName === "DIV") {
          annotateDiv(node as HTMLDivElement);
        }
        node.querySelectorAll?.("div").forEach((div) => {
          annotateDiv(div as HTMLDivElement);
        });
      });
    });
  });

  wireframeLabelObserver.observe(body, {
    childList: true,
    subtree: true,
  });
}

function teardownLabelObserver() {
  wireframeLabelObserver?.disconnect();
  wireframeLabelObserver = null;
}

function ensureTypographyLabelObserver() {
  if (
    typographyLabelObserver ||
    typeof MutationObserver === "undefined" ||
    typeof document === "undefined"
  )
    return;

  const body = document.body;
  if (!body) return;

  const annotate = () => {
    annotateAllTypographyNodes();
  };

  typographyLabelObserver = new MutationObserver(annotate);
  typographyLabelObserver.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}

function teardownTypographyLabelObserver() {
  typographyLabelObserver?.disconnect();
  typographyLabelObserver = null;
}

function updateAllDivLabels(enabled: boolean) {
  if (typeof document === "undefined") return;
  const divs = document.querySelectorAll<HTMLDivElement>("div");
  divs.forEach((div) => {
    if (!enabled) {
      div.removeAttribute("data-wireframe-label");
      resetRelativePosition(div);
      return;
    }
    annotateDiv(div);
  });
}

function annotateDiv(div: HTMLDivElement) {
  div.setAttribute("data-wireframe-label", buildDivLabel(div));
  ensureRelativePosition(div);
}

function ensureRelativePosition(div: HTMLDivElement) {
  if (div.dataset.wireframeRel === "true") return;
  const computed = window.getComputedStyle(div);
  if (computed.position === "static") {
    div.dataset.wireframeRel = "true";
    div.style.position = "relative";
  }
}

function resetRelativePosition(div: HTMLDivElement) {
  if (div.dataset.wireframeRel === "true") {
    div.style.removeProperty("position");
    delete div.dataset.wireframeRel;
  }
}

function buildDivLabel(div: HTMLDivElement) {
  let label = "div";

  if (div.id) {
    label += `#${div.id}`;
  }

  const classNames = Array.from(div.classList).filter(Boolean);
  if (classNames.length) {
    label += `.${classNames.join(".")}`;
  }

  const componentHint = div.dataset.component || div.getAttribute("aria-label");
  if (componentHint) {
    label += ` (${componentHint})`;
  }

  return label.length > 60 ? `${label.slice(0, 57)}…` : label;
}

function annotateAllTypographyNodes() {
  if (typeof document === "undefined") return;
  const nodes = document.querySelectorAll<HTMLElement>(TYPOGRAPHY_TARGET_SELECTOR);
  nodes.forEach(annotateTypographyNode);
}

function annotateTypographyNode(element: HTMLElement) {
  const hasManualAttribute =
    element.dataset.typographyAuto !== "true" && element.hasAttribute("data-typography-id");
  if (hasManualAttribute) {
    return;
  }

  const classList = element.classList;
  if (!classList || classList.length === 0) {
    if (element.dataset.typographyAuto === "true") {
      element.removeAttribute("data-typography-id");
      element.removeAttribute("data-typography-auto");
    }
    return;
  }

  let matchedId: TypographyScaleId | null = null;
  for (const signature of typographySignatures) {
    if (signature.classTokens.every((token) => classList.contains(token))) {
      matchedId = signature.id;
      break;
    }
  }

  if (matchedId) {
    element.dataset.typographyId = matchedId;
    element.dataset.typographyAuto = "true";
  } else if (element.dataset.typographyAuto === "true") {
    element.removeAttribute("data-typography-id");
    element.removeAttribute("data-typography-auto");
  }
}

function cleanupAutoTypographyLabels() {
  if (typeof document === "undefined") return;
  const nodes = document.querySelectorAll<HTMLElement>("[data-typography-auto='true']");
  nodes.forEach((element) => {
    element.removeAttribute("data-typography-id");
    element.removeAttribute("data-typography-auto");
  });
}

