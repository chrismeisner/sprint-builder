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
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {children}
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overflow-x-clip">
      <FadeIn key={pathname}>
        {children}
      </FadeIn>
    </div>
  );
}
