import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 4rem - 120px)' }}>
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Main content area - now blank */}
        
        {user && (
          <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Logged in as <span className="font-medium">{user.email}</span>
            </p>
            <Link
              href="/profile"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
