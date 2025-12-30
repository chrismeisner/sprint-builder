"use client";

type Props = {
  documentId: string;
  model?: string;
};

export default function CreateSprintButton(_props: Props) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-xs font-semibold opacity-60">AI</span>
      <span className="text-xs text-text-muted">AI generation disabled</span>
    </div>
  );
}


