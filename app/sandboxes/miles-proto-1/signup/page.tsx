"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { p } from "@/app/sandboxes/miles-proto-1/_lib/nav";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  terms?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!terms) {
      errs.terms = "You must agree to the Terms of Service to continue.";
    }
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      router.push(p("/scan-device"));
    }
  }

  const passwordValid = password.length >= 8;
  const canSubmit = firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    passwordValid &&
    terms;

  function handleChange() {
    if (submitted) {
      setErrors(validate());
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center px-6 py-16">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {/* Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/sandbox-files/styleguide/images/miles-logos/miles-badge-green.svg"
            alt="Miles"
            className="size-14"
          />

          {/* Header */}
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
              Create account
            </h1>
            <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
              Sign up so we can save your trips and pick up where you left off.
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

            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); handleChange(); }}
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                className={`h-12 rounded-md border bg-white px-4 text-base font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-500 motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${
                  errors.email
                    ? "border-red-400 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-500"
                    : "border-neutral-300 focus:ring-blue-500 dark:border-neutral-600 dark:focus:ring-blue-400"
                }`}
              />
              {errors.email && (
                <p id="email-error" className="text-xs font-normal leading-normal text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); handleChange(); }}
                  aria-describedby={`password-requirements${errors.password ? " password-error" : ""}`}
                  aria-invalid={!!errors.password}
                  className={`h-12 w-full rounded-md border bg-white pl-4 pr-12 text-base font-normal leading-normal text-neutral-900 outline-none placeholder:text-neutral-500 motion-safe:transition-shadow motion-safe:duration-200 motion-safe:ease-out focus:ring-2 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 ${
                    errors.password
                      ? "border-red-400 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-500"
                      : "border-neutral-300 focus:ring-blue-500 dark:border-neutral-600 dark:focus:ring-blue-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-neutral-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 focus-visible:outline-none"
                >
                  {showPassword ? (
                    <svg className="size-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="size-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
              {/* Password requirements */}
              <div id="password-requirements" className="flex items-center gap-1.5 pt-0.5">
                {password.length >= 8 ? (
                  <svg className="size-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="size-4 shrink-0 text-neutral-300 dark:text-neutral-600" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
                <span className={`text-xs font-normal leading-none ${password.length >= 8 ? "text-green-700 dark:text-green-400" : "text-neutral-500 dark:text-neutral-500"}`}>
                  At least 8 characters
                </span>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-normal leading-normal text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-1.5 pt-2">
              <div className="flex items-start gap-3">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => { setTerms(e.target.checked); handleChange(); }}
                  aria-describedby={errors.terms ? "terms-error" : undefined}
                  aria-invalid={!!errors.terms}
                  className={`mt-0.5 size-4 shrink-0 rounded focus:ring-blue-500 dark:border-neutral-600 ${
                    errors.terms ? "border-red-400 text-red-600" : "border-neutral-300 text-blue-600"
                  }`}
                />
                <label
                  htmlFor="terms"
                  className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500"
                >
                  I agree to the{" "}
                  <a href="#" className="underline">Terms of Service</a> and{" "}
                  <a href="#" className="underline">Privacy Policy</a>.
                </label>
              </div>
              {errors.terms && (
                <p id="terms-error" className="text-xs font-normal leading-normal text-red-600 dark:text-red-400">
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`mt-2 flex h-12 w-full items-center justify-center rounded-md px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900 ${
                canSubmit
                  ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                  : "cursor-not-allowed bg-blue-300 dark:bg-blue-800 dark:text-blue-400"
              }`}
            >
              Create account
            </button>

            <p className="text-center text-sm font-normal leading-normal text-neutral-500 dark:text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Sign in
              </Link>
            </p>

          </form>

        </div>
    </main>
  );
}
