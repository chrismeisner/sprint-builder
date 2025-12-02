"use client";

import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import SampleTextEditorModal from "@/components/sample-text-editor/SampleTextEditorModal";

type SampleTextEditorOptions = {
  label: string;
  helperText?: string;
  textareaLabel?: string;
  placeholder?: string;
  submitLabel?: string;
  resetLabel?: string;
  initialValue: string;
  onSubmit: (value: string) => void;
  onReset?: () => void;
};

type UseSampleTextEditorResult = {
  openEditor: (options: SampleTextEditorOptions) => void;
  closeEditor: () => void;
  editorModal: ReactNode;
  isOpen: boolean;
};

export default function useSampleTextEditor(): UseSampleTextEditorResult {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SampleTextEditorOptions | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const closeEditor = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
    setDraft("");
    setError(null);
  }, []);

  const openEditor = useCallback((config: SampleTextEditorOptions) => {
    setOptions(config);
    setDraft(config.initialValue ?? "");
    setError(null);
    setIsOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!options) {
      return;
    }
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Enter at least one character.");
      return;
    }
    options.onSubmit(trimmed);
    closeEditor();
  }, [draft, options, closeEditor]);

  const handleReset = useCallback(() => {
    if (!options?.onReset) {
      return;
    }
    options.onReset();
    closeEditor();
  }, [options, closeEditor]);

  const editorModal = useMemo(() => {
    if (!isOpen || !options) {
      return null;
    }
    return (
      <SampleTextEditorModal
        isOpen={isOpen}
        label={options.label}
        helperText={options.helperText}
        textareaLabel={options.textareaLabel}
        placeholder={options.placeholder}
        submitLabel={options.submitLabel}
        resetLabel={options.resetLabel}
        draft={draft}
        error={error}
        onChange={(value) => {
          if (error) {
            setError(null);
          }
          setDraft(value);
        }}
        onCancel={closeEditor}
        onSubmit={handleSubmit}
        onReset={options.onReset ? handleReset : undefined}
      />
    );
  }, [isOpen, options, draft, error, closeEditor, handleSubmit, handleReset]);

  return {
    openEditor,
    closeEditor,
    editorModal,
    isOpen,
  };
}


