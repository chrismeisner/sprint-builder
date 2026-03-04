import type { Metadata } from "next";
import UpdatesIntakeClient from "./UpdatesIntakeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start an Update — Chris Meisner",
  description:
    "Tell me what you want to iterate on this week. Available to existing clients who have completed a Foundation Sprint.",
};

export default function UpdatesIntakePage() {
  return (
    <main className="container max-w-2xl py-16">
      <div className="mb-4">
        <h1 className="text-4xl font-semibold leading-tight text-balance text-text-primary">
          Start an Update
        </h1>
        <p className="text-sm text-text-secondary mt-2 text-pretty">
          Tell me what you want to iterate on this week. Available to existing
          clients who have completed at least one Foundation Sprint.
        </p>
      </div>
      <UpdatesIntakeClient />
    </main>
  );
}
