"use client";

import { getTypographyClassName } from "@/lib/design-system/typography-classnames";
import type { DeliverableComponentProps } from "./index";

/**
 * Generic fallback component for deliverables without a specialized component.
 * Shows the raw data in a formatted way.
 */
export default function GenericDeliverableComponent({
  data,
  isEditable,
  mode,
  deliverableName,
}: DeliverableComponentProps) {
  const t = {
    heading: getTypographyClassName("h4"),
    body: `${getTypographyClassName("body-sm")} text-text-secondary`,
    label: `${getTypographyClassName("mono-sm")} text-text-muted`,
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/20 dark:border-white/20 p-6 text-center">
        <p className={t.body}>
          No custom data configured for this {deliverableName}.
        </p>
        {isEditable && mode === "sprint" && (
          <p className={`${t.body} mt-2 opacity-70`}>
            Custom data can be added via the content editor above.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-3">
      <h4 className={t.heading}>Custom Data</h4>
      <pre className={`${t.body} bg-black/5 dark:bg-white/5 rounded-md p-3 overflow-auto text-xs`}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

