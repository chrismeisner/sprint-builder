"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";

function FadeIn({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Double rAF: first frame lets React commit the DOM,
    // second frame lets the browser paint it — only then fade in.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`motion-safe:transition-opacity motion-safe:duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 min-h-0 overflow-x-clip">
      <FadeIn key={pathname}>
        {children}
      </FadeIn>
    </div>
  );
}
