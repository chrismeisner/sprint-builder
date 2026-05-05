"use client";

interface InlineEditFieldProps {
  value: string;
  onChange: (next: string) => void;
  /** Placeholder shown when value is empty. Color/weight come from the
   *  parent's className via the `placeholder:` Tailwind variant. */
  placeholder: string;
  ariaLabel: string;
  /** Tailwind classes for typography. Apply `placeholder:text-...` /
   *  `placeholder:font-...` here to control empty-state styling — e.g.
   *  `placeholder:text-semantic-info` for an iOS-blue CTA-style empty
   *  (plate row), or `placeholder:text-neutral-400` for a muted iOS Notes
   *  title. */
  className?: string;
  /** Silent cap on input length. iOS prefers preventing-typing over
   *  surfacing a validation error inline. */
  maxLength?: number;
  /** Native `autocapitalize` hint for the iOS keyboard — e.g.
   *  `"characters"` for plates, default `"sentences"`. */
  autoCapitalize?: "none" | "off" | "sentences" | "words" | "characters";
}

/**
 * iOS-style inline edit field — Notes / Reminders / Mail title pattern.
 *
 * The chrome is identical in read and edit modes. There's no border,
 * focus ring, pencil affordance, or layout shift on focus — the only
 * change between states is the cursor + the keyboard sliding up. Width
 * tracks content via the modern `field-sizing: content` CSS property.
 *
 * Validation is deliberately silent: enforce caps via maxLength, trim
 * via the parent's onChange handler. iOS rarely shows inline errors next
 * to text fields — UI either prevents the bad state or surfaces a system
 * alert.
 */
export function InlineEditField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  maxLength,
  autoCapitalize,
}: InlineEditFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      autoCorrect="off"
      spellCheck={false}
      className={`min-w-0 max-w-full border-0 bg-transparent p-0 outline-none [field-sizing:content] focus:outline-none focus:ring-0 ${className}`}
    />
  );
}
