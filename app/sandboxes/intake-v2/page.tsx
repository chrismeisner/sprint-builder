import Link from "next/link";
import IntakeFormClient from "./IntakeFormClient";

const JAM_SESSION = "/intake";

export default function IntakeV2Page() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-stroke-muted bg-background/90 backdrop-blur-sm">
        <div className="container max-w-2xl flex h-14 items-center justify-between">
          <Link
            href="/sandboxes/landing-v4"
            className="text-sm font-semibold text-text-primary"
          >
            Single Source
          </Link>
          <Link
            href={JAM_SESSION}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-md bg-text-primary px-4 text-sm font-semibold text-background transition-opacity duration-150 hover:opacity-90"
          >
            Start the intake
          </Link>
        </div>
      </header>

      <main className="container max-w-2xl py-12 md:py-16 space-y-8">
        {/* Intro */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold leading-tight text-text-primary">
            Tell us about your project.
          </h1>
          <p className="text-base text-text-secondary leading-relaxed">
            Takes about two minutes. We&apos;ll follow up within a day or two — or{" "}
            <a
              href={JAM_SESSION}
              className="underline hover:text-text-primary transition-colors"
            >
              start the intake
            </a>{" "}
            to get the conversation started.
          </p>
        </div>

        <hr className="border-stroke-muted" />

        {/* Form */}
        <IntakeFormClient />
      </main>

      {/* Footer */}
      <footer className="border-t border-stroke-muted">
        <div className="container max-w-2xl flex items-center justify-between py-8">
          <p className="text-sm font-medium text-text-primary">Single Source</p>
          <p className="text-sm text-text-muted">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
