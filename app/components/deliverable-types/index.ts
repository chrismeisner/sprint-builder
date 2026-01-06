/**
 * Deliverable Type Component Registry
 * 
 * Maps deliverable slugs or names to specialized React components.
 * Each component receives:
 * - data: The deliverable-specific data (parsed from JSON)
 * - isEditable: Whether the user can edit the content
 * - onChange: Callback when data changes
 * - mode: 'template' | 'sprint' - whether we're on global template or sprint-specific view
 */

import { ComponentType } from "react";
import ColorPaletteComponent from "./ColorPaletteComponent";
import TypographyComponent from "./TypographyComponent";
import LogoComponent from "./LogoComponent";
import GenericDeliverableComponent from "./GenericDeliverableComponent";

export type DeliverableComponentProps = {
  data: Record<string, unknown> | null;
  isEditable: boolean;
  onChange?: (data: Record<string, unknown>) => void;
  mode: "template" | "sprint";
  deliverableName: string;
};

type ComponentRegistry = Record<string, ComponentType<DeliverableComponentProps>>;

/**
 * Registry mapping deliverable slugs/patterns to their components.
 * Keys are matched against the deliverable slug in order:
 * 1. Exact slug match
 * 2. Partial match (slug contains key)
 * 3. Falls back to GenericDeliverableComponent
 */
const COMPONENT_REGISTRY: ComponentRegistry = {
  "color-palette": ColorPaletteComponent,
  "brand-colors": ColorPaletteComponent,
  "typography": TypographyComponent,
  "type-system": TypographyComponent,
  "font": TypographyComponent,
  "logo": LogoComponent,
  "logomark": LogoComponent,
  "wordmark": LogoComponent,
};

/**
 * Get the appropriate component for a deliverable based on its slug.
 */
export function getDeliverableComponent(
  slug: string | null | undefined
): ComponentType<DeliverableComponentProps> {
  if (!slug) return GenericDeliverableComponent;
  
  const normalizedSlug = slug.toLowerCase();
  
  // Exact match
  if (COMPONENT_REGISTRY[normalizedSlug]) {
    return COMPONENT_REGISTRY[normalizedSlug];
  }
  
  // Partial match
  for (const [key, component] of Object.entries(COMPONENT_REGISTRY)) {
    if (normalizedSlug.includes(key) || key.includes(normalizedSlug)) {
      return component;
    }
  }
  
  return GenericDeliverableComponent;
}

export {
  ColorPaletteComponent,
  TypographyComponent,
  LogoComponent,
  GenericDeliverableComponent,
};

