import type { Metadata } from "next";
import Link from "next/link";
import Typography from "@/components/ui/Typography";
import HillSlider from "./HillSlider";

export const metadata: Metadata = {
  title: "Refinement Cycle — Meisner Design",
  description:
    "A productized one-day design refinement service. Drag the marker on the hill to see where your feature is and what a cycle would deliver.",
};

export default function RefinementCyclePage() {
  return (
    <main className="min-h-screen py-16 space-y-16">
      {/* Header */}
      <section className="container max-w-3xl space-y-4">
        <Typography as="p" scale="mono-sm" className="opacity-60">
          Methodology
        </Typography>
        <Typography as="h1" scale="display-lg">
          Refinement Cycle
        </Typography>
        <Typography as="p" className="opacity-80">
          A Refinement Cycle pushes a feature as far across the hill as one day
          allows. Drag the marker below to see where your feature might be —
          and what a cycle starting from there would deliver.
        </Typography>
      </section>

      {/* Interactive hill */}
      <section className="container max-w-6xl">
        <HillSlider />
      </section>

      {/* Methodology context */}
      <section className="container max-w-3xl space-y-6">
        <Typography as="h2" scale="h2">
          The methodology
        </Typography>
        <Typography as="p" className="opacity-80">
          Same uphill / downhill philosophy as our two-week sprints — just
          compressed to one cycle of work per chunk of hill. Uphill is for
          figuring out <em>what</em> the feature is and how it behaves;
          downhill is for making it look like it belongs in your product.
        </Typography>
        <Typography as="p" className="opacity-80">
          A cycle is bounded by time, not progress. The further up the hill
          you hand off, the further down the other side you&rsquo;ll get back.
          We push as far as one day allows from wherever you start — that
          discipline is what makes the price fixed and the timeline tight.
        </Typography>
        <Typography as="p" className="opacity-80">
          Most features take two or three cycles to travel the full hill.
          Each cycle picks up exactly where the last one left off —
          visible progress, no lost ground, no rebuilds.
        </Typography>
      </section>

      {/* CTA */}
      <section className="container max-w-3xl">
        <div className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-neutral-950 p-6 sm:p-8 space-y-4">
          <Typography as="h2" scale="h2">
            Ready to push your feature across the hill?
          </Typography>
          <Typography as="p" className="opacity-80">
            Fixed price, next-day delivery. Submit a cycle through your
            studio dashboard and you&rsquo;ll have a decision by 5pm ET the
            same day.
          </Typography>
          <Typography as="p" className="opacity-70">
            <strong>$1,200 per cycle.</strong> Pilot rate of $800 available
            for the first cycle with new clients.
          </Typography>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/dashboard/refinement-cycles/new"
              className="inline-flex items-center rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity duration-150"
            >
              Submit a cycle
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Read about our methodology →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
