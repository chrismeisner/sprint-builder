"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, label, ...rest }, ref) => {
  const selectClassName = className?.trim().length ? className : undefined;
  const selectElement = (
    <select ref={ref} className={selectClassName} {...rest}>
      {children}
    </select>
  );

  if (!label) {
    return selectElement;
  }

  return (
    <label className="inline-flex flex-col gap-1 text-sm font-medium text-foreground dark:text-white">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/70 dark:text-white/70">{label}</span>
      {selectElement}
    </label>
  );
});

Select.displayName = "Select";

export default Select;


