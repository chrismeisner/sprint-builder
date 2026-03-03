import Typography from "@/components/ui/Typography";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-card text-text-primary">
      <section className="container max-w-3xl py-16 space-y-12">

        <div className="space-y-3">
          <Typography as="h1" scale="h2">
            Terms of Service
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Last updated: March 2026
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            1. Overview
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            These Terms of Service govern your use of meisner.design and any services purchased through it. By using this site or engaging us for work, you agree to these terms. We&apos;re Chris Meisner LLC (doing business as Chris Meisner Studio), a design and product studio based in the United States.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            2. Services
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            We provide digital design and product development services, structured as fixed-scope engagements called &ldquo;sprints.&rdquo; Each sprint is a two-week block of work delivering UX design, product prototyping, strategy, and related digital artifacts. The scope, deliverables, timeline, and price of each engagement are agreed upon before work begins.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            3. Payment
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Payment is collected via Stripe. Sprint packages are fixed-price — there are no subscriptions or recurring charges unless explicitly agreed in writing. Some engagements split payment into an upfront deposit and a deferred portion paid upon completion; the terms for any deferred arrangement are outlined in your engagement agreement.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            4. Deliverables &amp; Ownership
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Upon receipt of full payment, you own the final deliverables produced for your project. Work-in-progress materials remain our property until payment is complete. We reserve the right to display completed work in our portfolio and case studies unless you request otherwise in writing prior to the start of the engagement.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            5. Revisions &amp; Scope
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Each sprint has a defined scope. Requests that fall outside that scope will be assessed and priced separately. We will flag any scope changes before performing additional work — you will never be charged for out-of-scope work without prior agreement.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            6. Cancellations
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            If you cancel an engagement after work has begun, you are responsible for payment proportional to the work completed at the time of cancellation. Upfront deposits are non-refundable. See our Week 1 Alignment Guarantee on each package page for details on how we handle early-stage misalignment.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            7. Limitation of Liability
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            We are not liable for indirect, incidental, or consequential damages arising from the use of our services. Our total liability for any claim related to an engagement is limited to the total amount you paid us for that engagement.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            8. Changes to These Terms
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            We may update these terms from time to time. Changes will be posted to this page with an updated date. Continued use of our services after changes are posted constitutes your acceptance of the updated terms.
          </Typography>
        </div>

        <div className="border-t border-black/10 dark:border-white/10 pt-8">
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Questions? Email us at{" "}
            <a href="mailto:hello@meisner.design" className="underline underline-offset-2 hover:opacity-70 transition">
              hello@meisner.design
            </a>
          </Typography>
        </div>

      </section>
    </main>
  );
}
