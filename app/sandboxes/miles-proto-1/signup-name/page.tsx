"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useRouter } from "next/navigation";
import { p } from "@/app/sandboxes/miles-proto-1/_lib/nav";
import { useRef, useState } from "react";

interface FormErrors {
  firstName?: string;
  lastName?: string;
}

export default function SignupNamePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      router.push(p("/dashboard?state=empty&welcome=1"));
    }
  }

  function handleChange() {
    if (submitted) setErrors(validate());
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Create your profile
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            This is how you&rsquo;ll appear in the app.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
              aria-label="Add profile photo"
            >
              {photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={photo} alt="Profile" className="size-full object-cover" />
              ) : (
                <svg
                  className="size-10 text-neutral-400 dark:text-neutral-500"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              )}
              {photo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 motion-safe:transition-opacity motion-safe:duration-150 group-hover:opacity-100">
                  <svg
                    className="size-5 text-white"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                    />
                  </svg>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 rounded px-3 text-sm font-medium leading-none text-blue-600 motion-safe:transition-colors motion-safe:duration-150 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-400 dark:hover:bg-blue-950"
            >
              {photo ? "Change photo" : "Add photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="firstName"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Chris"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); handleChange(); }}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                aria-invalid={!!errors.firstName}
                autoFocus
                className={`h-12 rounded-md border bg-white px-4 text-base font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-500 motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${
                  errors.firstName
                    ? "border-red-400 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-500"
                    : "border-neutral-300 focus:ring-blue-500 dark:border-neutral-600 dark:focus:ring-blue-400"
                }`}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-xs font-normal leading-normal text-red-600 dark:text-red-400">
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="lastName"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Meisner"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); handleChange(); }}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                aria-invalid={!!errors.lastName}
                className={`h-12 rounded-md border bg-white px-4 text-base font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-500 motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${
                  errors.lastName
                    ? "border-red-400 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-500"
                    : "border-neutral-300 focus:ring-blue-500 dark:border-neutral-600 dark:focus:ring-blue-400"
                }`}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-xs font-normal leading-normal text-red-600 dark:text-red-400">
                  {errors.lastName}
                </p>
              )}
            </div>

          </div>

          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Go to my dashboard
          </button>
        </form>

      </div>
    </main>
  );
}
