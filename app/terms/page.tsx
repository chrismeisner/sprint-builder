import Typography from "@/components/ui/Typography";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-surface-card text-text-primary">
      <section className="container max-w-3xl py-16 space-y-4">
        <Typography as="h1" scale="h2">
          Terms of Service
        </Typography>
        <Typography as="p" scale="body-lg" className="text-text-secondary">
          This is a placeholder. We&apos;ll publish the full terms of service here soon.
        </Typography>
      </section>
    </main>
  );
}

