import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="container py-24 space-y-6">
        <p className="text-sm uppercase tracking-[0.2em] text-text-secondary">Home</p>
        <h1 className="text-4xl font-semibold text-text-primary">Welcome to Great Work Studio</h1>
        <p className="text-lg text-text-secondary">
          We moved our full landing experience to{" "}
          <Link href="/landing" className="underline underline-offset-4">
            /landing
          </Link>
          . Use the navigation above to explore or jump there now.
        </p>
      </section>
    </main>
  );
}
