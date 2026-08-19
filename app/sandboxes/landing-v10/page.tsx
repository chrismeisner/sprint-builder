import Image from "next/image";
import Link from "next/link";
import FadeInSection from "@/app/components/FadeInSection";

const PAGE_CLASS = "min-h-dvh bg-background flex flex-col";
const MAIN_CLASS = "flex-1 flex items-start justify-center px-6 py-24";
const COLUMN_CLASS = "w-full max-w-lg space-y-16";
const BLOCK_CLASS = "space-y-6";
const DIVIDER_CLASS = "border-t border-stroke-muted";
const OVERLINE_CLASS = "text-xs font-medium uppercase tracking-wide leading-none text-text-muted";
const TITLE_CLASS = "text-2xl font-semibold leading-snug text-text-primary";
const OFFER_NAME_CLASS = "text-lg font-medium leading-snug text-text-primary";
const PRICE_CLASS = "text-lg font-semibold leading-snug tabular-nums text-text-primary";
const BODY_CLASS = "text-base font-normal leading-relaxed text-pretty text-text-secondary";
const META_CLASS = "text-sm font-normal leading-normal text-pretty text-text-muted";
const FOOTER_TEXT_CLASS = "text-sm text-text-muted";
const PRIMARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90";
const SECONDARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md border border-stroke-muted bg-surface-subtle px-6 text-base font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-strong";
const TEXT_LINK_CLASS = "underline underline-offset-4 text-text-primary hover:opacity-70 transition-opacity";

// Source art is white line-work on a solid black plate. The asset is converted to
// white-ink-on-transparent, so `invert` renders it as black ink in light mode and
// `dark:invert-0` leaves it white on the dark surface.
const CLIMBER_CLASS = "h-auto w-40 invert dark:invert-0";

type Offer = {
  name: string;
  price: string;
  priceNote: string;
  body: string;
  href: string;
  ctaLabel: string;
};

const offers: Offer[] = [
  {
    name: "Custom Sprint",
    price: "From $8,000",
    priceNote: "Budget scales with deliverables",
    body:
      "Pick brand, product, or mixed deliverables from the library. The studio builds a transparent proposal — priced from your selections — and we kick off in 2 weeks.",
    href: "/packages",
    ctaLabel: "Browse sprint packages →",
  },
  {
    name: "Monthly Support",
    price: "From $4,000",
    priceNote: "per month",
    body:
      "After your sprint, the studio stays on call for updates and iterations on your existing deliverables. Includes a biweekly 30-minute check-in to review feedback and plan the next round.",
    href: "/intake",
    ctaLabel: "Ask about support →",
  },
];

const steps = [
  {
    number: "01",
    title: "Discovery & intake",
    body: "Share your context, blockers, and goals so we can prep before we meet.",
  },
  {
    number: "02",
    title: "Reserve your sprint",
    body: "Choose a Monday kickoff, sign the agreement, and submit the 50% deposit in your dashboard.",
  },
  {
    number: "03",
    title: "Kickoff Monday",
    body: "A 3-hour workshop on Day 1, then async updates and scheduled touchpoints all week.",
  },
  {
    number: "04",
    title: "Friday handoff",
    body: "Day 10 brings the final presentation, deliverables, and Loom walkthroughs.",
  },
];

export default function LandingV10() {
  return (
    <div className={PAGE_CLASS}>
      <main className={MAIN_CLASS}>
        <div className={COLUMN_CLASS}>

          {/* Block 1 — Intro */}
          <FadeInSection triggerOnMount>
            <div className={BLOCK_CLASS}>
              <Image
                src="/landing-v10/climber.png"
                alt="Illustration of a climber in a suit ascending a rock face with rope and ice axe"
                width={1024}
                height={1536}
                priority
                className={CLIMBER_CLASS}
              />
              <h1 className={TITLE_CLASS}>Alchemize Your Vision</h1>
              <p className={BODY_CLASS}>
                Two-week sprints that distill your vision into aligned strategy, brand, and
                buildable prototypes.
              </p>
              <div>
                <Link href="/packages" className={PRIMARY_CTA_CLASS}>
                  See sprint packages →
                </Link>
              </div>
            </div>
          </FadeInSection>

          <div className={DIVIDER_CLASS} />

          {/* Block 2 — Offers */}
          {offers.map((offer) => (
            <FadeInSection key={offer.name}>
              <div className={BLOCK_CLASS}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className={OFFER_NAME_CLASS}>{offer.name}</h2>
                  <span className={PRICE_CLASS}>{offer.price}</span>
                </div>
                <p className={BODY_CLASS}>{offer.body}</p>
                <p className={META_CLASS}>{offer.priceNote}</p>
                <div>
                  <Link href={offer.href} className={SECONDARY_CTA_CLASS}>
                    {offer.ctaLabel}
                  </Link>
                </div>
              </div>
            </FadeInSection>
          ))}

          <div className={DIVIDER_CLASS} />

          {/* Block 3 — The arc */}
          <FadeInSection>
            <div className={BLOCK_CLASS}>
              <p className={OVERLINE_CLASS}>How sprints work</p>
              <h2 className={TITLE_CLASS}>Two weeks. One clear outcome.</h2>
              <p className={BODY_CLASS}>
                Every sprint runs the same 10-day arc — workshop on Day 1, direction locked by
                Day 5, heads-down build in Week 2, real deliverables in your hands on Day 10.
              </p>
              <dl className="space-y-4">
                {steps.map((step) => (
                  <div key={step.number} className="flex gap-4">
                    <dt className={`${META_CLASS} tabular-nums shrink-0 pt-0.5`}>{step.number}</dt>
                    <dd className="space-y-1">
                      <p className={OFFER_NAME_CLASS}>{step.title}</p>
                      <p className={BODY_CLASS}>{step.body}</p>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className={BODY_CLASS}>
                <Link href="/sprints" className={TEXT_LINK_CLASS}>
                  See the complete process →
                </Link>
              </p>
            </div>
          </FadeInSection>

          <div className={DIVIDER_CLASS} />

          {/* Block 4 — Start */}
          <FadeInSection>
            <div className={BLOCK_CLASS}>
              <p className={BODY_CLASS}>
                Start with the intake form so we can prep before we meet, or book a discovery call
                if you would rather talk it through live.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="https://form.typeform.com/to/eEiCy7Xj"
                  target="_blank"
                  rel="noreferrer"
                  className={PRIMARY_CTA_CLASS}
                >
                  Fill the intake →
                </Link>
                <Link
                  href="https://cal.com/chrismeisner/intro"
                  target="_blank"
                  rel="noreferrer"
                  className={SECONDARY_CTA_CLASS}
                >
                  Book an introduction →
                </Link>
              </div>
              <p className={META_CLASS}>
                Already booked?{" "}
                <Link href="/login" className={TEXT_LINK_CLASS}>
                  Log in to the portal →
                </Link>
              </p>
            </div>
          </FadeInSection>

        </div>
      </main>

      <footer className={DIVIDER_CLASS}>
        <div className="flex justify-center px-6 py-8">
          <p className={FOOTER_TEXT_CLASS}>© 2026 Chris Meisner</p>
        </div>
      </footer>
    </div>
  );
}
