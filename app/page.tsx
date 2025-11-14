export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center font-[family-name:var(--font-geist-sans)] p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          sprint builder
        </h1>
        <p className="opacity-80">Incoming Typeform submissions are stored and viewable.</p>
        <a
          className="inline-block rounded-full border border-black/10 dark:border-white/15 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition"
          href="/documents"
        >
          View stored submissions
        </a>
      </div>
    </main>
  );
}
