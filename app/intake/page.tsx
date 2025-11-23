import Link from "next/link";

export default function IntakePage() {
  return (
    <main className="min-h-screen max-w-3xl mx-auto px-6 py-16">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm opacity-70 hover:opacity-100 transition"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Request a Follow-On Sprint
          </h1>
          <p className="text-base sm:text-lg opacity-80 leading-relaxed">
            Welcome back! Tell us about your next iteration or expansion sprint. We&apos;ll review your request and get back to you with a proposal within 24 hours.
          </p>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02] p-6 space-y-3">
          <h3 className="font-semibold">What happens next?</h3>
          <ul className="space-y-2 text-sm opacity-80">
            <li className="flex items-start gap-2">
              <span className="mt-1">1.</span>
              <span>Fill out this quick form with your goals and desired deliverables</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">2.</span>
              <span>We&apos;ll review and prepare a sprint proposal with fixed pricing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">3.</span>
              <span>Schedule your Mini Foundation Workshop (1 hour) to kick things off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1">4.</span>
              <span>Execute your 2-week sprint following our proven process</span>
            </li>
          </ul>
        </div>

        {/* Temporary Notice */}
        <div className="rounded-lg border-2 border-black/20 dark:border-white/20 bg-white dark:bg-black p-8 space-y-6 text-center">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Intake Form Coming Soon</h2>
            <p className="text-base opacity-80 max-w-xl mx-auto">
              We&apos;re building a streamlined intake form for returning clients. In the meantime, please reach out directly to request your next sprint.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <a
              href="mailto:hello@yourstudio.com?subject=Follow-on Sprint Request&body=Hi! I&apos;m a returning client and would like to request a follow-on sprint.%0A%0AProject Goals:%0A[Describe what you want to achieve]%0A%0ADesired Deliverables:%0A[List specific deliverables you&apos;re interested in]%0A%0ATimeline:%0A[When would you like to start?]%0A%0AThanks!"
              className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 font-semibold hover:opacity-90 transition"
            >
              Email us directly
            </a>
            <Link
              href="/packages"
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-6 py-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              Browse deliverables
            </Link>
          </div>
        </div>

        {/* What to Include */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">What to include in your request:</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Project Context</h4>
              <ul className="text-sm opacity-80 space-y-1">
                <li>• What&apos;s changed since last sprint?</li>
                <li>• What feedback did you receive?</li>
                <li>• What&apos;s the current challenge?</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Sprint Goals</h4>
              <ul className="text-sm opacity-80 space-y-1">
                <li>• What do you want to achieve?</li>
                <li>• Which deliverables do you need?</li>
                <li>• Any specific constraints?</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Timeline</h4>
              <ul className="text-sm opacity-80 space-y-1">
                <li>• When would you like to start?</li>
                <li>• Any hard deadlines?</li>
                <li>• Preferred check-in schedule?</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Reference Material</h4>
              <ul className="text-sm opacity-80 space-y-1">
                <li>• Links to current work</li>
                <li>• Examples or inspiration</li>
                <li>• User feedback or data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

