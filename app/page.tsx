import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center font-[family-name:var(--font-geist-sans)] p-6">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          LET&apos;S BUILD
        </h1>
        <p className="text-lg sm:text-xl opacity-80">
          Turn your vision into a structured 2-week sprint—no endless meetings, no scope creep, just results.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/how-it-works"
            className="inline-flex items-center rounded-full bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
          >
            How it works
          </Link>
          <Link
            href="https://form.typeform.com/to/eEiCy7Xj"
            target="_blank"
            className="inline-flex items-center rounded-full border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            Start your sprint →
          </Link>
        </div>
      </div>
    </main>
  );
}
