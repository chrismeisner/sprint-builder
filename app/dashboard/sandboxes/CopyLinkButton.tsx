"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const fullUrl = `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-stroke-muted bg-surface-strong/60 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-surface-strong"
    >
      {copied ? "Copied ✓" : "Copy link"}
    </button>
  );
}
