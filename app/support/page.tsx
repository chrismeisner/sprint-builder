import Link from "next/link";
import Typography from "@/components/ui/Typography";
import SupportForm from "./SupportForm";

export const metadata = {
  title: "Support — Chris Meisner Studio",
  description: "Get help with your sprint, project, billing, or anything else.",
};

const FAQ = [
  {
    q: "How do I access my project?",
    a: "Log in at meisner.design/login with your email address. You'll receive a magic link — no password needed. Once in, you'll see any projects you've been added to.",
  },
  {
    q: "What happens after I purchase a sprint package?",
    a: "We'll reach out within one business day to confirm deliverables, schedule your kickoff Monday, and send a sprint agreement. Your sprint slot isn't locked until the deposit is collected and the agreement is signed.",
  },
  {
    q: "Can I change the deliverables in a package?",
    a: "Yes. Packages are starting points, not fixed contracts. Once we connect, we can swap, add, or remove deliverables and update the pricing accordingly.",
  },
  {
    q: "What is the Week 1 Alignment Guarantee?",
    a: "If at the end of Week 1 you don't feel we've aligned on a clear direction, you can end the sprint. We retain the 50% deposit to cover Week 1 strategy work, and you keep all artifacts produced. No additional payment required.",
  },
  {
    q: "When am I charged?",
    a: "A 50% deposit is collected at the start of your sprint to secure your slot. The remaining 50% is invoiced and collected upon delivery at the end of Week 2.",
  },
  {
    q: "How do I request a refund?",
    a: "Upfront deposits are non-refundable. If you have a billing concern or dispute, email us at hello@meisner.design and we'll work through it directly.",
  },
  {
    q: "How long does a sprint take?",
    a: "Every sprint is exactly two weeks — 10 business days. Week 1 is strategy and direction (uphill), Week 2 is production and delivery (downhill).",
  },
  {
    q: "I have a technical issue with the platform.",
    a: "Use the contact form below or email hello@meisner.design with a description of what you're seeing. Screenshots are always helpful.",
  },
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-surface-card text-text-primary">

      {/* Header */}
      <section className="container max-w-3xl pt-16 pb-10 space-y-3">
        <Typography as="h1" scale="h2">
          Support
        </Typography>
        <Typography as="p" scale="body-lg" className="text-text-secondary">
          Need help with a sprint, your account, or something else? Browse the FAQ below or send us a message and we&apos;ll get back to you within one business day.
        </Typography>
      </section>

      {/* Quick links */}
      <section className="container max-w-3xl pb-12">
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href="/login"
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-5 hover:border-black/20 dark:hover:border-white/20 transition space-y-1"
          >
            <p className="text-base font-semibold">Client portal</p>
            <p className="text-sm text-text-secondary">Log in to view your project and sprint activity.</p>
          </Link>
          <Link
            href="/packages"
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-5 hover:border-black/20 dark:hover:border-white/20 transition space-y-1"
          >
            <p className="text-base font-semibold">Sprint packages</p>
            <p className="text-sm text-text-secondary">Browse available packages and pricing.</p>
          </Link>
          <a
            href="mailto:hello@meisner.design"
            className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-5 hover:border-black/20 dark:hover:border-white/20 transition space-y-1"
          >
            <p className="text-base font-semibold">Email us directly</p>
            <p className="text-sm text-text-secondary">hello@meisner.design</p>
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl pb-16 space-y-6">
        <Typography as="h2" scale="h3">
          Frequently asked questions
        </Typography>
        <div className="divide-y divide-black/10 dark:divide-white/10 rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="bg-white dark:bg-gray-950 px-6 py-5 space-y-2">
              <p className="text-sm font-semibold">{q}</p>
              <p className="text-sm text-text-secondary leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact form */}
      <section className="container max-w-3xl pb-24 space-y-6">
        <div className="space-y-2">
          <Typography as="h2" scale="h3">
            Send us a message
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Don&apos;t see your question above? We&apos;ll respond within one business day.
          </Typography>
        </div>
        <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 p-6 sm:p-8">
          <SupportForm />
        </div>
      </section>

    </main>
  );
}
