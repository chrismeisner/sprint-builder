export const WIREFRAME_STORAGE_KEY = "wireframeModeEnabled";
export const WIREFRAME_LABELS_STORAGE_KEY = "wireframeLabelsEnabled";

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

