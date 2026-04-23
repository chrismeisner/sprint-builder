import Link from "next/link";
import FadeInSection from "@/app/components/FadeInSection";

const PAGE_CLASS = "min-h-dvh bg-background flex flex-col";
const MAIN_CLASS = "flex-1 flex items-start justify-center px-6 py-24";
const COLUMN_CLASS = "w-full max-w-lg space-y-16";
const BLOCK_CLASS = "space-y-6";
const DIVIDER_CLASS = "border-t border-stroke-muted";
const TITLE_CLASS = "text-2xl font-semibold leading-snug text-text-primary";
const BODY_CLASS = "text-base font-normal leading-relaxed text-pretty text-text-secondary";
const FOOTER_TEXT_CLASS = "text-sm text-text-muted";
const PRIMARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md bg-text-primary px-6 text-base font-semibold text-background transition-opacity duration-150 hover:opacity-90";
const SECONDARY_CTA_CLASS =
  "inline-flex h-12 items-center justify-center rounded-md border border-stroke-muted bg-surface-subtle px-6 text-base font-semibold text-text-primary transition-colors duration-150 hover:bg-surface-strong";

export default function LandingV5() {
  return (
    <div className={PAGE_CLASS}>
      <main className={MAIN_CLASS}>
        <div className={COLUMN_CLASS}>

          {/* Block 1 — Intro */}
          <FadeInSection triggerOnMount>
            <div className={BLOCK_CLASS}>
              <h1 className={TITLE_CLASS}>Chris Meisner</h1>
              <p className={BODY_CLASS}>
                Designer, strategist, and builder working at the intersection of product, brand,
                and code.
              </p>
              <div>
                <Link
                  href="https://chrismeisner.studio"
                  target="_blank"
                  rel="noreferrer"
                  className={PRIMARY_CTA_CLASS}
                >
                  chrismeisner.studio →
                </Link>
              </div>
            </div>
          </FadeInSection>

          <div className={DIVIDER_CLASS} />

          {/* Block 2 — Freaky Friday */}
          <FadeInSection>
            <div className={BLOCK_CLASS}>
              <div className="space-y-4">
                <p className={BODY_CLASS}>
                  Every Friday I send a short note about what I&apos;ve been building that week —
                  a component, a workflow, a Figma trick, something I figured out in real time. No
                  polish. Just the work.
                </p>
              </div>
              <div>
                <Link
                  href="https://cal.com/chrismeisner/freaky-friday"
                  target="_blank"
                  rel="noreferrer"
                  className={SECONDARY_CTA_CLASS}
                >
                  Book a Friday slot →
                </Link>
              </div>
            </div>
          </FadeInSection>

          <div className={DIVIDER_CLASS} />

          {/* Block 3 — Direct */}
          <FadeInSection>
            <div className={BLOCK_CLASS}>
              <p className={BODY_CLASS}>
                Available for direct engagements outside the sprint model. Embedded with your
                team, handling the work and the project management. Flat weekly rate.
              </p>
              <div>
                <Link
                  href="/intake"
                  target="_blank"
                  rel="noreferrer"
                  className={SECONDARY_CTA_CLASS}
                >
                  Start the intake →
                </Link>
              </div>
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
