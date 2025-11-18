import Link from "next/link";

export const dynamic = "force-static";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto p-6 space-y-8 font-[family-name:var(--font-geist-sans)]">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">How sprint builder works</h1>
        <p className="text-sm text-gray-600">
          This page explains the full flow from client intake form to sprint draft and deliverables. It&apos;s written
          for both potential users and for us as a living spec of how the app should behave.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">High-level flow</h2>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Client fills out an intake form (Typeform or similar) describing their project and goals.</li>
          <li>We receive the submission as JSON via a webhook and store it as a <span className="font-mono">document</span>.</li>
          <li>An admin clicks &quot;Create Sprint&quot; for a document, which calls OpenAI with our prompts.</li>
          <li>OpenAI returns a structured sprint draft JSON (goals, backlog, timeline, risks, etc.).</li>
          <li>The sprint draft is stored in the database and can be viewed and refined in the UI.</li>
          <li>Each sprint draft includes 1–3 deliverables selected from our deliverables catalog.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data model (simplified)</h2>
        <div className="rounded-lg border border-black/10 dark:border-white/15 p-4 text-sm space-y-2">
          <div>
            <span className="font-mono font-semibold">documents</span> — raw intake payloads
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1">
            <li>
              <span className="font-mono">content</span> is the raw JSON from Typeform.
            </li>
            <li>
              Every sprint draft is attached to exactly one <span className="font-mono">document</span>.
            </li>
          </ul>
          <div>
            <span className="font-mono font-semibold">ai_responses</span> — OpenAI responses for traceability
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1">
            <li>Stores prompts, raw response text, and parsed JSON (if valid).</li>
            <li>Used for debugging, audit, and iteration on prompts.</li>
          </ul>
          <div>
            <span className="font-mono font-semibold">sprint_drafts</span> — structured sprint plans
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1">
            <li>
              <span className="font-mono">draft</span> is a JSON object containing fields like{' '}
              <span className="font-mono">sprintTitle</span>, <span className="font-mono">goals</span>,{' '}
              <span className="font-mono">backlog</span>, <span className="font-mono">timeline</span>,{' '}
              <span className="font-mono">assumptions</span>, <span className="font-mono">risks</span>,{' '}
              <span className="font-mono">notes</span>, and <span className="font-mono">deliverables</span>.
            </li>
            <li>
              The <span className="font-mono">deliverables</span> field is an array of{' '}
              <span className="font-mono">&#123; deliverableId, name, reason &#125;</span>.
            </li>
          </ul>
          <div>
            <span className="font-mono font-semibold">deliverables</span> — catalog of available deliverables
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1">
            <li>Each deliverable has an id, name, category (e.g. Branding, Product), description, and default points.</li>
            <li>
              The sprint generator is instructed to choose 1–3 deliverables by <span className="font-mono">id</span> from
              this catalog.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">From intake JSON to sprint draft</h2>
        <p className="text-sm text-gray-700">
          The sprint generation is handled by a single API endpoint at{' '}
          <span className="font-mono">POST /api/documents/[id]/sprint</span>.
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>We load the stored document JSON for the given id.</li>
          <li>We pick the OpenAI model (default is <span className="font-mono">gpt-4o-mini</span>).</li>
          <li>
            We load the sprint prompts from app settings (with sensible defaults) and append a description of the
            deliverables catalog.
          </li>
          <li>We call OpenAI with response_format = json_object to force a single JSON payload.</li>
          <li>We parse and store the result in both <span className="font-mono">ai_responses</span> and{' '}
            <span className="font-mono">sprint_drafts</span>.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Admin tools and configuration</h2>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>
            <span className="font-semibold">Dashboard</span> (<Link href="/dashboard" className="underline">
              /dashboard
            </Link>
            ) — quick links, prompt settings, and DB utilities.
          </li>
          <li>
            <span className="font-semibold">Prompt settings</span> — edit the system/user prompts used for sprint
            generation without changing code.
          </li>
          <li>
            <span className="font-semibold">Deliverables admin</span> (
            <Link href="/dashboard/deliverables" className="underline">
              /dashboard/deliverables
            </Link>
            ) — create, edit, and activate/deactivate deliverables that the model can choose from.
          </li>
          <li>
            <span className="font-semibold">Database utilities</span> — run schema creation and see basic counts to verify
            connectivity.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How someone would actually use this</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          <li>
            Use the shared intake form at{" "}
            <Link href="https://form.typeform.com/to/eEiCy7Xj" className="underline" target="_blank">
              https://form.typeform.com/to/eEiCy7Xj
            </Link>{" "}
            and connect it to the <span className="font-mono">/api/documents</span> webhook.
          </li>
          <li>Verify that new submissions appear in the Documents list.</li>
          <li>Configure prompt text and deliverables in the Dashboard.</li>
          <li>For a new client submission, click &quot;Create Sprint&quot; from the Documents page.</li>
          <li>Review the generated sprint draft and associated deliverables on the Sprint page.</li>
          <li>Use this draft as the starting point for the actual client-facing plan.</li>
        </ol>
      </section>

      <footer className="pt-4 border-t border-black/10 dark:border-white/15 text-xs text-gray-500 space-y-1">
        <p>
          Internal note: if we update how sprint generation works (fields, prompts, deliverables), we should also update
          this page so it stays the single source of truth.
        </p>
      </footer>
    </main>
  );
}


