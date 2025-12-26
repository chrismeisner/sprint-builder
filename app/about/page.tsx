import SectionIntro from "../components/SectionIntro";
import SectionHeader from "../components/SectionHeader";
import AboutFounder from "../components/AboutFounder";

export default function AboutPage() {
  return (
    <main className="min-h-screen py-16 space-y-16">
      <section className="container text-center space-y-6">
        <SectionIntro text="About" />
        <SectionHeader
          heading="Meet the founder"
          description="Learn how Chris Meisner runs decisive, high-quality sprints for early-stage teams and fast-moving product orgs."
        />
      </section>

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
    </main>
  );
}

