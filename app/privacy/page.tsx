import Typography from "@/components/ui/Typography";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-surface-card text-text-primary">
      <section className="container max-w-3xl py-16 space-y-12">

        <div className="space-y-3">
          <Typography as="h1" scale="h2">
            Privacy Policy
          </Typography>
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Last updated: March 2026
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            What we collect
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We collect your name, email address, and any information you voluntarily provide through our intake forms or account creation. If you make a purchase, payment information is processed by Stripe — we do not store credit card numbers or payment credentials on our servers.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            How we use it
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We use your information to communicate with you about your project, provide access to your account and deliverables, and send relevant transactional updates (e.g., login links, sprint activity). We do not sell your data or share it with third parties except as necessary to provide our services.
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            Service providers we rely on include: Stripe (payments), Mailgun (transactional email), and Google Cloud Storage (file hosting). Each operates under their own privacy policies and data processing agreements.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            Cookies &amp; analytics
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We use cookies to manage your login session. We may use Google Analytics to understand how people use the site — this data is anonymized and aggregated, and does not identify individual visitors. You can disable cookies in your browser settings, though some site features may not function correctly without them.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            Data retention
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We retain your account and project data for as long as your account is active or as needed to fulfill ongoing engagements. You can request deletion of your personal data at any time by emailing us.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            Your rights
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            You have the right to access, correct, or delete your personal data at any time. If you&apos;d like to exercise any of these rights, please reach out directly and we&apos;ll respond promptly.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            Security
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We take reasonable measures to protect your information, including encrypted connections (HTTPS), session-based authentication, and access controls on our systems. No method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
          </Typography>
        </div>

        <div className="space-y-4">
          <Typography as="h2" scale="h3">
            Changes to this policy
          </Typography>
          <Typography as="p" scale="body-lg" className="text-text-secondary">
            We may update this policy from time to time. Changes will be posted to this page with an updated date. Continued use of our services after changes are posted constitutes your acceptance of the updated policy.
          </Typography>
        </div>

        <div className="border-t border-black/10 dark:border-white/10 pt-8">
          <Typography as="p" scale="body-md" className="text-text-secondary">
            Questions or requests? Email us at{" "}
            <a href="mailto:hello@meisner.design" className="underline underline-offset-2 hover:opacity-70 transition">
              hello@meisner.design
            </a>
          </Typography>
        </div>

      </section>
    </main>
  );
}
