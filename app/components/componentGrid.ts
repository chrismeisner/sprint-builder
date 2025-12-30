export type ComponentGridScale = 1 | 2 | 3;

export type ComponentGridPreset = {
  id: "single" | "double" | "triple";
  scale: ComponentGridScale;
  label: string;
  description: string;
  className: string;
};

const presetsByScale: Record<ComponentGridScale, ComponentGridPreset> = {
  1: {
    id: "single",
    scale: 1,
    label: "Single column",
    description: "Matches single-card hero sections and marketing callouts",
    className: "grid grid-cols-1 gap-8",
  },
  2: {
    id: "double",
    scale: 2,
    label: "Two-up grid",
    description: "Mirrors the standard `md:grid-cols-2` layout from packages/how-it-works sections",
    className: "grid grid-cols-1 md:grid-cols-2 gap-8",
  },
  3: {
    id: "triple",
    scale: 3,
    label: "Three-up grid",
    description: "Simulates a responsive three-up layout (`md:grid-cols-2 xl:grid-cols-3`) used in dense sections",
    className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8",
  },
};

export const componentGridPresets = presetsByScale;
export const componentGridPresetList: ComponentGridPreset[] = [
  presetsByScale[1],
  presetsByScale[2],
  presetsByScale[3],
];

export function resolveComponentGridPreset(count: number | ComponentGridScale): ComponentGridPreset {
  if (count >= 3) {
    return presetsByScale[3];
  }

  if (count === 2) {
    return presetsByScale[2];
  }

  return presetsByScale[1];
}

export function getComponentGridClassName(count: number): string {
  return resolveComponentGridPreset(count).className;
}





























