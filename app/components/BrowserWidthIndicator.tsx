"use client";

import { useEffect, useState } from "react";
import Typography from "@/components/ui/Typography";

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
    <div className="flex items-center rounded-full border border-stroke-muted bg-surface-subtle px-3 py-1">
      <Typography as="span" scale="mono-sm" className="text-text-secondary">
        Width: {width ?? "--"}px
      </Typography>
    </div>
  );
}
