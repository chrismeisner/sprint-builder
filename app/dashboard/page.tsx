import Link from "next/link";
import PromptSettingsClient from "./PromptSettingsClient";
import DatabaseToolsClient from "./DatabaseToolsClient";

export default function DashboardPage() {
  const links = [
    { href: "/", label: "Home" },
    { href: "/documents", label: "Documents" },
    { href: "/ai-test", label: "OpenAI Test" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <p className="text-sm text-gray-600 mb-6">
        Quick links to available pages:
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <PromptSettingsClient />
      <DatabaseToolsClient />
    </div>
  );
}


