"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";

type Route = { href: string; label: string };

export default function DashboardScanClient() {
  const [routes, setRoutes] = useState<Route[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function scan() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/dashboard-scan");
      if (!res.ok) throw new Error("Scan failed");
      const data = (await res.json()) as { routes: Route[] };
      setRoutes(data.routes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={scan} disabled={loading}>
          {loading ? "Scanning…" : "Scan Routes"}
        </Button>
        {routes && (
          <Typography as="p" scale="body-sm" className="text-black/50 dark:text-white/50">
            {routes.length} route{routes.length !== 1 ? "s" : ""} found
          </Typography>
        )}
        {error && (
          <Typography as="p" scale="body-sm" className="text-red-500">
            {error}
          </Typography>
        )}
      </div>

      {routes && (
        <div className="grid gap-3 md:grid-cols-2">
          {routes.map((route) => (
            <Button
              key={route.href}
              as={Link}
              href={route.href}
              variant="secondary"
              className="justify-between text-left"
            >
              <span>{route.label}</span>
              <span className="text-[11px] font-normal normal-case tracking-normal opacity-60">→</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
