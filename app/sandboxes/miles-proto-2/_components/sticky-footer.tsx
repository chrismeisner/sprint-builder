import { ReactNode } from "react";

interface StickyFooterProps {
  children: ReactNode;
}

export function StickyFooter({ children }: StickyFooterProps) {
  return (
    <div className="sticky bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/95">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-3 px-6 py-4">
        {children}
      </div>
    </div>
  );
}
