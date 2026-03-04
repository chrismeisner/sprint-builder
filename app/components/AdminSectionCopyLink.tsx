"use client";

import { useState, useCallback } from "react";

type Props = {
  anchorId: string;
};

export default function AdminSectionCopyLink({ anchorId }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [anchorId]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy link to #${anchorId}`}
      className="absolute top-2 right-2 z-10 opacity-0 group-hover/section:opacity-100 inline-flex items-center gap-1.5 rounded-md border border-stroke-muted bg-surface-card px-2 py-1 text-xs font-mono text-text-muted shadow-sm transition-all duration-150 hover:border-stroke-strong hover:text-text-primary hover:shadow-md"
    >
      {copied ? (
        <>
          <svg className="size-3 text-semantic-success" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8l3.5 3.5L13 4" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg className="size-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5V9.5A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
          <span>#{anchorId}</span>
        </>
      )}
    </button>
  );
}
