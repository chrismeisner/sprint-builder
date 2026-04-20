import Link from "next/link";

export const metadata = {
  title: "Unsubscribe · Meisner Design",
  robots: { index: false, follow: false },
};

type SearchParams = { status?: string; c?: string };

const CATEGORY_LABELS: Record<string, string> = {
  all: "all email notifications",
  "member-add-admin": "new member notifications",
  "member-removed-admin": "member removal notifications",
  "daily-summary": "daily sprint summaries",
  "deferred-comp": "deferred compensation updates",
  notification: "email notifications",
};

function describeCategory(category: string | undefined): string {
  if (!category) return "email notifications";
  return CATEGORY_LABELS[category] || category.replace(/-/g, " ");
}

export default function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const status = searchParams.status || "";
  const category = searchParams.c;

  if (status === "ok") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-zinc-900">You&rsquo;re unsubscribed</h1>
        <p className="mt-3 text-zinc-600">
          We won&rsquo;t send you any more <strong>{describeCategory(category)}</strong>.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          You&rsquo;ll still receive security-related mail (sign-in links, verification
          codes, invoices, and payment receipts) because those are required for your
          account.
        </p>
        <BackLink />
      </Shell>
    );
  }

  if (status === "invalid") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-zinc-900">That link isn&rsquo;t valid</h1>
        <p className="mt-3 text-zinc-600">
          The unsubscribe link may have expired or been modified. If you&rsquo;d still like
          to opt out, reply to the original email and we&rsquo;ll remove you manually.
        </p>
        <BackLink />
      </Shell>
    );
  }

  if (status === "error") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold text-zinc-900">Something went wrong</h1>
        <p className="mt-3 text-zinc-600">
          We couldn&rsquo;t record your unsubscribe request. Please try the link again
          in a minute, or reply to the original email to be removed manually.
        </p>
        <BackLink />
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold text-zinc-900">Unsubscribe</h1>
      <p className="mt-3 text-zinc-600">
        Use the unsubscribe link included in any notification email to opt out of
        that category of mail.
      </p>
      <BackLink />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-zinc-200 rounded-lg p-8 shadow-sm">
        {children}
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <p className="mt-6">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900 underline underline-offset-2"
      >
        ← Back to meisner.design
      </Link>
    </p>
  );
}
