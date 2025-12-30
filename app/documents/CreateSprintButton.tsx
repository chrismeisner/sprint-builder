"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  documentId: string;
  model?: string;
};

export default function CreateSprintButton({ documentId, model }: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-semibold opacity-60">AI</span>
      <span className="text-xs text-text-muted">AI generation disabled</span>
    </div>
  );
}


