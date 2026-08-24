import Link from "next/link";
import FadeInSection from "../components/FadeInSection";

export const dynamic = "force-dynamic";

// 3rem offsets match the sticky h-12 header so header + main fit the viewport
// exactly and the page never scrolls; the top padding puts the content's top
// edge at 40% of the viewport height.
const MAIN_CLASS =
  "min-h-[calc(100dvh-3rem)] flex items-start justify-center px-6 pt-[calc(40dvh-3rem)] pb-12";
const COLUMN_CLASS = "w-full max-w-lg space-y-6 text-center";
const BODY_CLASS = "text-base font-normal leading-relaxed text-pretty text-text-secondary";
const TEXT_LINK_CLASS = "underline underline-offset-4 text-text-primary hover:opacity-70 transition-opacity";

export default async function LandingPage() {
  return (
    <main className={MAIN_CLASS}>
      <FadeInSection triggerOnMount>
        <div className={COLUMN_CLASS}>
          <p className={BODY_CLASS}>
            You may have been accidentally directed here from{" "}
            <Link href="https://chrismeisner.com" className={TEXT_LINK_CLASS}>
              chrismeisner.com
            </Link>
            .
          </p>
        </div>
      </FadeInSection>
    </main>
  );
}
