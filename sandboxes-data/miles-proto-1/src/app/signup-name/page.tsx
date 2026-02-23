"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      router.push("/dashboard?state=empty&welcome=1");
    }
  }

  function handleChange() {
    if (submitted) setErrors(validate());
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-400 dark:text-neutral-500">
              Step 2 of 2
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              What&rsquo;s your name?
            </h1>
          </div>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            We&rsquo;ll use this to personalize your experience and attribute trips correctly.
          </p>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
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

          <button
            type="submit"
            className="mt-2 flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Continue
          </button>
        </form>

      </div>
    </main>
  );
}
