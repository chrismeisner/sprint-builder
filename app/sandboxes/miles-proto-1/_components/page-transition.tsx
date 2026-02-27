"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { BASE, p } from "@/app/sandboxes/miles-proto-1/_lib/nav";

const NAV_HIDDEN_ON = new Set([
  BASE, BASE + "/",
  ...(["/signup", "/signup-name", "/scan-device", "/permissions",
  "/billing", "/install", "/find-port", "/plug-in-device",
  "/pair-device", "/getting-online", "/help-port", "/device-detected",
  "/whos-driving"].flatMap((r) => [p(r), p(r) + "/"])),
]);

function FadeIn({ children, className }: { children: ReactNode; className?: string }) {
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
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-1000 motion-safe:ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showNav = !NAV_HIDDEN_ON.has(pathname);

  return (
    <FadeIn key={pathname} className={`flex-1 ${showNav ? "pb-20" : ""}`}>
      {children}
    </FadeIn>
  );
}
