"use client";

import { useEffect, useRef, useState } from "react";
import Typography from "./Typography";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type WelcomeModalProps = {
  isOpen: boolean;
  onComplete: (firstName: string, lastName: string) => void;
  saving?: boolean;
};

export default function WelcomeModal({
  isOpen,
  onComplete,
  saving = false,
}: WelcomeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    
    if (!lastName.trim()) {
      setError("Last name is required");
      return;
    }

    setError(null);
    onComplete(firstName.trim(), lastName.trim());
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-black/10 dark:border-white/10 p-0 max-w-md w-full mx-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed"
      style={{ margin: 0 }}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-2">
          <Typography as="h2" scale="h3" className="text-black dark:text-white">
            Welcome! 👋
          </Typography>
          <Typography as="p" scale="body-md" className="text-black/70 dark:text-white/70">
            Let&apos;s get to know you. Please enter your name to continue.
          </Typography>
        </div>

        <div className="space-y-3">
          <div>
            <label 
              htmlFor="firstName" 
              className={`${getTypographyClassName("body-sm")} text-text-primary block mb-2`}
            >
              First name
            </label>
            <input
              id="firstName"
              type="text"
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setError(null);
              }}
              className={`${getTypographyClassName("body-base")} w-full rounded-md border border-black/10 dark:border-white/15 px-4 py-3 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition`}
              placeholder="John"
              disabled={saving}
              autoFocus
            />
          </div>

          <div>
            <label 
              htmlFor="lastName" 
              className={`${getTypographyClassName("body-sm")} text-text-primary block mb-2`}
            >
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setError(null);
              }}
              className={`${getTypographyClassName("body-base")} w-full rounded-md border border-black/10 dark:border-white/15 px-4 py-3 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition`}
              placeholder="Doe"
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <div className={`${getTypographyClassName("body-sm")} rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-red-700 dark:text-red-300`}>
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className={`${getTypographyClassName("button-sm")} px-6 py-3 rounded-md transition-colors bg-black text-white dark:bg-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Get started"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
