import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex flex-col gap-2 text-lg">
          <Link href="/sprint-builder" className="underline underline-offset-4">
            Sprint Builder
          </Link>
          <Link
            href="/deferred-compensation"
            className="underline underline-offset-4"
          >
            Deferred Compensation Calculator
          </Link>
        </div>
      </div>
    </main>
  );
}
