import Link from "next/link";
import PackageCard, { type SprintPackage } from "../components/PackageCard";
import HeroSection from "../components/HeroSection";
import SectionHeader from "../components/SectionHeader";
import SectionIntro from "../components/SectionIntro";
import GettingStartedStep, { getGettingStartedStackClassName } from "../components/GettingStartedStep";
import AboutFounder from "../components/AboutFounder";
import FAQSection from "@/components/ui/FAQSection";
import FadeInSection from "../components/FadeInSection";
import { resolveComponentGridPreset } from "../components/componentGrid";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const gettingStartedSteps = [
    {
      number: "01",
      title: "Discovery & intake form",
      body: (
        <>
          Share your company context, blockers, and goals in the sprint intake form so we can prep before we meet.{" "}
          <Link href="https://form.typeform.com/to/eEiCy7Xj" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            Fill the intake →
          </Link>{" "}
          or{" "}
          <Link href="https://cal.com/chrismeisner/intro" target="_blank" rel="noreferrer" className="underline underline-offset-4">
            book a discovery call
          </Link>{" "}
          if you prefer to talk it through live.
        </>
      ),
    },
    {
      number: "02",
      title: "Reserve your sprint",
      body: (
        <>
          Choose a Monday kickoff, sign the sprint agreement, and submit the 50% deposit directly inside your client dashboard.{" "}
          <Link href="/login" className="underline underline-offset-4">
            Log in to the portal →
          </Link>{" "}
          to review paperwork, invoices, and prep tasks.
        </>
      ),
    },
    {
      number: "03",
      title: "Kickoff Monday + sync cadence",
      body: (
        <>
          We run the 3-hour kickoff workshop on Day 1, then keep you in the loop with async updates and scheduled touchpoints the rest of the week. Curious about the full rhythm?{" "}
          <Link href="/sprints" className="underline underline-offset-4">
            See the complete process →
          </Link>
        </>
      ),
    },
    {
      number: "04",
      title: "Friday handoff & roadshows",
      body:
        "Day 10 includes the final presentation, deliverables, and Loom walkthroughs so you can run internal roadshows or external feedback sessions immediately.",
    },
  ];

  const featuredPackages: SprintPackage[] = [
    {
      id: "sprint-builder",
      name: "Custom Sprint",
      slug: "packages",
      description: "Build a sprint around the exact deliverables you need.",
      tagline: "Your deliverables. Your budget.",
      summary: "Pick brand, product, or mixed deliverables from our library. The studio builds a transparent proposal—priced from your selections—and we kick off in 2 weeks.",
      badgeLabel: "Starting at $8,000",
      highlights: ["Choose your deliverables", "Transparent points-based pricing", "Always 2 weeks"],
      priceLabel: "From $8,000",
      priceSuffix: "Budget scales with deliverables",
      ctaLabel: "Browse sprint packages",
      ctaHref: "/packages",
      deliverables: [],
    },
    {
      id: "support-subscription",
      name: "Monthly Support",
      slug: "support-subscription",
      description: "Ongoing support for updates and iterations on existing deliverables.",
      tagline: "Keep the studio on call",
      summary: "The studio stays available for updates and iterations on your existing deliverables. Includes a biweekly check-in every two weeks to review feedback and plan the next round of work.",
      badgeLabel: "After your sprint",
      highlights: ["Biweekly 30-min check-in", "Ongoing deliverable updates", "Feedback → plan → iterate"],
      priceLabel: "From $4,000",
      priceSuffix: "per month",
      ctaLabel: "Ask about support",
      ctaHref: "/intake",
      deliverables: [],
    },
  ];
  const gettingStartedLayoutClass = getGettingStartedStackClassName(gettingStartedSteps.length);

  const featuredGridPreset = resolveComponentGridPreset(featuredPackages.length || 1);
  const faqItems = [
    {
      question: "How is sprint pricing determined?",
      answer:
        "Every sprint is priced from the deliverables you choose. Each deliverable carries a complexity point value, and the total is calculated transparently before you commit. Sprints start around $8,000 for a lighter scope and can reach $20,000 for a fully loaded set of deliverables.",
    },
    {
      question: "How do payments work?",
      answer:
        "50% is due when you lock a Monday kickoff via Stripe. The remaining 50% is due on Day 10 when we hand off final files with Loom walkthroughs.",
    },
    {
      question: "What if I need a break between sprints?",
      answer:
        "No problem. Most founders pause 2–4 weeks to test, gather feedback, or get internal buy-in. When you’re ready, we build a new sprint proposal from the deliverable library and kick off on the next available Monday.",
    },
    {
      question: "Can we mix brand, product, and marketing work?",
      answer:
        "Yes. The deliverable library covers brand identity, messaging, UX/UI, launch assets, and more. We’ll help prioritize the right mix during your kickoff workshop.",
    },
    {
      question: "What is Monthly Support?",
      answer:
        "After a sprint, you can keep the studio on call with a monthly support plan starting at $4,000/month. It includes a biweekly 30-minute check-in every two weeks to review feedback on existing deliverables and plan any updates for the next two weeks. Scope stays manageable—no new sprints, just keeping what you shipped sharp.",
    },
  ];

  return (
    <main className="min-h-screen">
      <FadeInSection triggerOnMount>
        <HeroSection
          eyebrow="Now booking January 2026"
          title="Alchemize Your Vision"
          subtitle="Two-week sprints that distill your vision into aligned strategy, brand, and buildable prototypes."
          primaryCta={{ label: "See sprint packages", href: "/packages" }}
          primaryVariant="accent"
          secondaryCta={{ label: "Book an Introduction", href: "https://cal.com/chrismeisner/intro" }}
        />
      </FadeInSection>

      {/* Services */}
      <FadeInSection>
        <section id="foundation-packages" className="container max-w-6xl py-16 space-y-10">
          <div
            className={`${featuredGridPreset.className} mb-12`}
            data-component-grid={featuredGridPreset.id}
          >
            {featuredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} variant="detailed" showEmojis={true} />
            ))}
          </div>
        </section>
      </FadeInSection>

      {/* How sprints work */}
      <FadeInSection>
        <section className="py-20">
          <div className="container max-w-6xl space-y-6">
            <SectionIntro text="How sprints work" className="text-text-secondary" />
            <SectionHeader
              heading="Two weeks. One clear outcome."
              description="Every sprint runs the same 10-day arc—workshop on Day 1, direction locked by Day 5, heads-down build in Week 2, and real deliverables in your hands on Day 10. The cadence is the same every time, regardless of what you’re building."
              headingClassName="text-text-primary"
              descriptionClassName="text-text-secondary"
            />
          </div>
        </section>
      </FadeInSection>

      {/* Getting Started */}
      <FadeInSection>
        <section className="py-16 bg-background">
          <div className="container max-w-6xl space-y-10">
            <SectionIntro text="Getting started" />

            <div className={gettingStartedLayoutClass}>
              {gettingStartedSteps.map((step) => (
                <GettingStartedStep key={step.number} number={step.number} title={step.title} body={step.body} />
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <FAQSection
          heading="Questions about the sprint cadence?"
          description="A few quick answers about how we book, build, and deliver every 10-day sprint."
          items={faqItems}
          className="bg-surface-subtle"
        />
      </FadeInSection>

      <FadeInSection>
        <AboutFounder
          name="Chris Meisner"
          title="Founder & Creative Director"
          imageSrc="/founder.jpg"
          socialLinks={[
            { label: "LinkedIn", href: "https://linkedin.com/in/chrismeisner" },
            { label: "Twitter", href: "https://twitter.com/chrismeisner" },
          ]}
          experienceLinks={[
            { label: "NYTimes feature — Fast launches", href: "https://www.nytimes.com/" },
            { label: "TechCrunch — Studio playbooks", href: "https://techcrunch.com/" },
            { label: "Case study — Global retail sprint", href: "/work" },
          ]}
          bio={
            <>
              <p>
                I&apos;ve led sprints for pre-seed teams and public companies alike. Every engagement is built on the same promise: decisive direction, high fidelity work, and zero wasted cycles.
              </p>
              <p>
                In past lives I&apos;ve run in-house design teams, launched new ventures inside enterprise orgs, and helped founders sharpen the story behind their next raise or release. This studio is the best of those reps packaged into a repeatable climb.
              </p>
            </>
          }
        />
      </FadeInSection>

    </main>
  );
}

