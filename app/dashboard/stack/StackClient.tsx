"use client";

type ConfigStatus = {
  database: boolean;
  storage: boolean;
  mailgun: boolean;
  openai: boolean;
  analytics: boolean;
};

export type StackClientProps = {
  configStatus: ConfigStatus;
};

const stackSections: Array<{
  title: string;
  description: string;
  items: Array<{
    name: string;
    summary: string;
    files?: string[];
    env?: string[];
    docs?: string;
    statusKey?: keyof ConfigStatus;
    badges?: string[];
  }>;
}> = [
  {
    title: "Core Application",
    description: "Frameworks and libraries that power every screen in the admin dashboard.",
    items: [
      {
        name: "Next.js 14 App Router",
        summary: "Server Components + Route Handlers live under `/app/**`, giving us streaming, RSC, and middleware support for the admin.",
        files: ["app/layout.tsx", "app/dashboard/**", "middleware.ts"],
        docs: "https://nextjs.org/docs/app",
      },
      {
        name: "React 18 + TypeScript",
        summary: "All interactive experiences (AI tools, editors, preview panes) are authored as typed client components for predictable props and hooks.",
        files: ["tsconfig.json", "app/**/Client.tsx"],
        docs: "https://react.dev",
      },
      {
        name: "Tailwind CSS + Design Tokens",
        summary: "Tailwind powers the UI layer with shared tokens defined in `tailwind.config.ts` and surfaced via `/dashboard/style-guide`.",
        files: ["tailwind.config.ts", "lib/design-system/tokens.ts", "app/dashboard/style-guide/StyleGuideClient.tsx"],
        docs: "https://tailwindcss.com/docs",
      },
    ],
  },
  {
    title: "Data & Storage",
    description: "Persistence layer for intake documents, sprint drafts, and file uploads.",
    items: [
      {
        name: "PostgreSQL (via node-postgres)",
        summary: "Primary data store accessed through `lib/db.ts` with pooled connections and schema helpers.",
        files: ["lib/db.ts", "scripts/make-admin.sql"],
        env: ["DATABASE_URL"],
        statusKey: "database",
        docs: "https://www.postgresql.org/docs/",
      },
      {
        name: "Google Cloud Storage",
        summary: "Uploads (docs, hero images, deliverable assets) use the GCS SDK with optional inline credentials.",
        files: ["lib/storage.ts", "app/dashboard/storage-test/*"],
        env: ["GCS_PROJECT_ID", "GCS_BUCKET_NAME", "GCS_CREDENTIALS_JSON | GOOGLE_APPLICATION_CREDENTIALS"],
        statusKey: "storage",
        docs: "https://cloud.google.com/storage/docs",
      },
    ],
  },
  {
    title: "Messaging & Auth",
    description: "Transactional email and passwordless login flows.",
    items: [
      {
        name: "Mailgun",
        summary: "All outbound email (magic links, sprint notifications) goes through Mailgun using helpers in `lib/email.ts` and `/dashboard/email-test`.",
        files: ["lib/email.ts", "app/api/admin/email-test/route.ts", "app/dashboard/email-test/*"],
        env: ["MAILGUN_API_KEY", "MAILGUN_DOMAIN", "MAILGUN_FROM_EMAIL"],
        statusKey: "mailgun",
        docs: "https://www.mailgun.com/",
      },
      {
        name: "Magic-Link Sessions",
        summary: "Custom HMAC-signed session tokens stored in the `sb_session` cookie guard every admin route.",
        files: ["lib/auth.ts", "app/api/auth/magic-link/*"],
      },
    ],
  },
  {
    title: "AI & Automation",
    description: "AI connection for future features and content generation.",
    items: [
      {
        name: "OpenAI (gpt-4o / 4o-mini)",
        summary: "OpenAI API connection for AI features. Currently used for API connectivity testing and content generation tools.",
        files: ["app/api/ai/test/route.ts", "app/api/admin/how-it-works-writer/route.ts"],
        env: ["OPENAI_API_KEY", "OPENAI_PROJECT_ID (optional)", "OPENAI_ORG_ID (optional)"],
        statusKey: "openai",
        docs: "https://platform.openai.com/docs",
      },
      {
        name: "Messaging Store",
        summary: "Brand language blocks and messaging templates live in `lib/messaging.ts` to keep output on-brand.",
        files: ["lib/messaging.ts"],
      },
    ],
  },
  {
    title: "Analytics & Tooling",
    description: "Everything we use to observe the app in production.",
    items: [
      {
        name: "Google Analytics (gtag)",
        summary: "Client-side analytics script is injected via `app/GoogleAnalytics.tsx` when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set.",
        files: ["app/GoogleAnalytics.tsx"],
        env: ["NEXT_PUBLIC_GA_MEASUREMENT_ID"],
        statusKey: "analytics",
        docs: "https://developers.google.com/analytics",
      },
      {
        name: "Heroku Procfile + Vercel-ready build",
        summary: "The repo ships with a Procfile for Heroku-style containers plus standard `next build` scripts for Vercel.",
        files: ["Procfile", "package.json"],
      },
    ],
  },
];

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active
          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
      }`}
    >
      {active ? "Configured" : "Needs config"}
    </span>
  );
}

export default function StackClient({ configStatus }: StackClientProps) {
  return (
    <div className="container max-w-6xl py-10 space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">Admin Reference</p>
        <h1 className="text-3xl font-bold">Stack & Services</h1>
        <p className="text-base opacity-70 max-w-3xl">
          Quick inventory of the frameworks, APIs, and third-party services wired into this project. Keep this list handy
          when onboarding new contributors or verifying environment variables before a deploy.
        </p>
      </header>

      {stackSections.map((section) => (
        <section key={section.title} className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">{section.title}</h2>
            <p className="text-sm opacity-70 mt-1 max-w-3xl">{section.description}</p>
          </div>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-black p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm opacity-70 mt-1 max-w-3xl">{item.summary}</p>
                  </div>
                  {item.statusKey ? (
                    <StatusBadge active={configStatus[item.statusKey]} />
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-4 text-xs">
                  {item.files && item.files.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase tracking-wide opacity-60">Files</span>
                      <div className="flex flex-wrap gap-1">
                        {item.files.map((file) => (
                          <code key={file} className="rounded bg-black/5 dark:bg-white/10 px-2 py-1 text-xs font-mono">
                            {file}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.env && item.env.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase tracking-wide opacity-60">Env</span>
                      <div className="flex flex-wrap gap-1">
                        {item.env.map((envVar) => (
                          <code key={envVar} className="rounded bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-100 px-2 py-1">
                            {envVar}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.docs && (
                    <a
                      href={item.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-300 hover:underline"
                    >
                      Docs →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

