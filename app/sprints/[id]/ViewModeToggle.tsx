"use client";

import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  isAdminView: boolean;
  onToggle: () => void;
};

export default function ViewModeToggle({ isAdminView, onToggle }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className={`${getTypographyClassName("body-sm")} text-white/60`}>
        Viewing as:
      </span>
      <button
        onClick={onToggle}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${
          isAdminView
            ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
            : "border-blue-400/50 bg-blue-500/20 text-blue-200"
        } ${getTypographyClassName("button-sm")}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isAdminView ? "bg-amber-400" : "bg-blue-400"
          }`}
        />
        {isAdminView ? "Admin" : "Member"}
      </button>
    </div>
  );
}
