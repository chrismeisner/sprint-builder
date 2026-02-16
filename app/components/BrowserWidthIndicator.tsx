"use client";

import { useEffect, useState } from "react";

export default function BrowserWidthIndicator() {
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex items-center rounded-full border border-stroke-muted bg-surface-subtle px-2 py-0.5">
      <span className="text-xs font-normal leading-normal tabular-nums text-text-secondary">
        {width ?? "--"}px
      </span>
    </div>
  );
}
