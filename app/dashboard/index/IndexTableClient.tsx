"use client";

import { useMemo, useState } from "react";
import type { AppPageInfo } from "@/lib/page-inventory";

type SortKey = "route" | "filePath" | "updatedAt";
type SortDirection = "asc" | "desc";

function sortPages(pages: AppPageInfo[], key: SortKey, direction: SortDirection) {
  const modifier = direction === "asc" ? 1 : -1;
  return [...pages].sort((a, b) => {
    let result = 0;
    if (key === "updatedAt") {
      const aDate = new Date(a.updatedAt).getTime();
      const bDate = new Date(b.updatedAt).getTime();
      result = aDate - bDate;
    } else {
      result = a[key].localeCompare(b[key]);
    }
    return result * modifier;
  });
}

type Props = {
  pages: AppPageInfo[];
};

export default function IndexTableClient({ pages }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("route");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const sortedPages = useMemo(() => sortPages(pages, sortKey, direction), [pages, sortKey, direction]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  };

  const renderSortLabel = (label: string, key: SortKey) => {
    const isActive = sortKey === key;
    const arrow = !isActive ? "↕" : direction === "asc" ? "↑" : "↓";
    return `${label} ${arrow}`;
  };

  return (
    <div className="overflow-auto rounded-xl border border-stroke-muted bg-surface-card">
      <table className="min-w-full text-sm">
        <thead className="border-b border-stroke-muted bg-surface-strong/60 text-left text-xs uppercase tracking-wide">
          <tr>
            <th
              className="px-4 py-3 font-semibold"
              aria-sort={sortKey === "route" ? (direction === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:underline"
                onClick={() => toggleSort("route")}
              >
                {renderSortLabel("Route", "route")}
              </button>
            </th>
            <th
              className="px-4 py-3 font-semibold"
              aria-sort={sortKey === "filePath" ? (direction === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:underline"
                onClick={() => toggleSort("filePath")}
              >
                {renderSortLabel("File", "filePath")}
              </button>
            </th>
            <th
              className="px-4 py-3 font-semibold whitespace-nowrap"
              aria-sort={sortKey === "updatedAt" ? (direction === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                className="flex items-center gap-1 hover:underline"
                onClick={() => toggleSort("updatedAt")}
              >
                {renderSortLabel("Last updated", "updatedAt")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPages.map((page) => (
            <tr key={page.filePath} className="border-b border-stroke-muted/70 last:border-b-0">
              <td className="px-4 py-3">
                <a href={page.route} className="text-brand-primary hover:underline">
                  {page.route}
                </a>
              </td>
              <td className="px-4 py-3 font-mono text-[12px]">{page.filePath}</td>
              <td className="px-4 py-3 whitespace-nowrap text-black/70 dark:text-white/70">
                {new Date(page.updatedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

