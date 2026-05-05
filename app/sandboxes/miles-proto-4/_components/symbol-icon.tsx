/**
 * Material Symbols wrapper — stand-in for SF Symbols in the iOS build.
 *
 * iOS mapping:
 *   <SymbolIcon name="speed" filled />
 *     → Image(systemName: "speedometer").symbolVariant(.fill)
 *
 *   size="sm" → 15pt   (inline icons paired with text labels)
 *   size="md" → 20pt   (default; standalone icons)
 *
 * The Material Symbols font is loaded once in the proto-4 layout.
 */

type SymbolSize = "sm" | "md";

const SIZE_PX: Record<SymbolSize, number> = {
  sm: 15,
  md: 20,
};

export function SymbolIcon({
  name,
  filled = false,
  size = "md",
  className = "text-text-muted",
}: {
  name: string;
  filled?: boolean;
  size?: SymbolSize;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: SIZE_PX[size],
        lineHeight: 1,
        ...(filled ? { fontVariationSettings: "'FILL' 1" } : null),
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
