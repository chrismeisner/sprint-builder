import Link from "next/link";

import Typography from "@/components/ui/Typography";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center space-y-4 text-center">
      <Typography as="h3" scale="h3">
        Have a nice day
      </Typography>
      <div className="space-y-2">
        <Link href="http://localhost:3000/sprint-builder" className="underline underline-offset-2">
          Sprint Builder
        </Link>
        <br />
        <Link href="http://localhost:3000/deferred-compensation" className="underline underline-offset-2">
          Deferred Compensation Calculator
        </Link>
      </div>
    </main>
  );
}
