"use client";

import { useState } from "react";
import { getTypographyClassName } from "@/lib/design-system/typography-classnames";

type Props = {
  agreement: string;
  generatedAt: string | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
};

export default function AgreementPreview({ agreement, generatedAt, onRegenerate, isRegenerating }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agreement);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Simple markdown to HTML conversion for preview
  const renderMarkdown = (md: string) => {
    // Split into lines and process
    const lines = md.split("\n");
    const elements: JSX.Element[] = [];
    let inTable = false;
    let tableRows: string[] = [];
    let tableKey = 0;

    const processTableRows = () => {
      if (tableRows.length === 0) return null;
      
      // First row is header, second is separator, rest are data
      const headerCells = tableRows[0].split("|").filter(c => c.trim());
      const dataRows = tableRows.slice(2); // Skip header and separator
      
      tableKey++;
      return (
        <div key={`table-${tableKey}`} className="overflow-x-auto my-4">
          <table className="min-w-full border border-black/10 dark:border-white/15 rounded-lg overflow-hidden text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                {headerCells.map((cell, i) => (
                  <th 
                    key={i} 
                    className={`px-3 py-2 text-left font-medium ${i === 1 ? 'text-right' : ''}`}
                  >
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rowIndex) => {
                const cells = row.split("|").filter(c => c.trim());
                return (
                  <tr key={rowIndex} className="border-t border-black/10 dark:border-white/10">
                    {cells.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className={`px-3 py-2 ${cellIndex === 1 ? 'text-right' : ''}`}
                      >
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Table detection
      if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(trimmedLine);
        continue;
      } else if (inTable) {
        // End of table
        const tableElement = processTableRows();
        if (tableElement) elements.push(tableElement);
        inTable = false;
        tableRows = [];
      }

      // Headers
      if (trimmedLine.startsWith("# ")) {
        elements.push(
          <h1 key={i} className={`${getTypographyClassName("h2")} mt-6 mb-4`}>
            {trimmedLine.slice(2)}
          </h1>
        );
      } else if (trimmedLine.startsWith("## ")) {
        elements.push(
          <h2 key={i} className={`${getTypographyClassName("h3")} mt-5 mb-3`}>
            {trimmedLine.slice(3)}
          </h2>
        );
      } else if (trimmedLine.startsWith("**") && trimmedLine.endsWith("**")) {
        // Bold paragraph (like field labels)
        elements.push(
          <p key={i} className={`${getTypographyClassName("body-sm")} font-semibold my-1`}>
            {trimmedLine.slice(2, -2)}
          </p>
        );
      } else if (trimmedLine.startsWith("**")) {
        // Bold label with value (like "**Key:** Value")
        const boldMatch = trimmedLine.match(/^\*\*([^*]+)\*\*(.*)$/);
        if (boldMatch) {
          elements.push(
            <p key={i} className={`${getTypographyClassName("body-sm")} my-1`}>
              <strong>{boldMatch[1]}</strong>{boldMatch[2]}
            </p>
          );
        } else {
          elements.push(
            <p key={i} className={`${getTypographyClassName("body-sm")} my-1`}>
              {trimmedLine}
            </p>
          );
        }
      } else if (trimmedLine.startsWith("- ")) {
        // List item
        elements.push(
          <li key={i} className={`${getTypographyClassName("body-sm")} ml-4 my-1`}>
            {trimmedLine.slice(2)}
          </li>
        );
      } else if (trimmedLine === "---") {
        elements.push(<hr key={i} className="my-6 border-black/10 dark:border-white/15" />);
      } else if (trimmedLine === "") {
        // Empty line - spacer
        elements.push(<div key={i} className="h-2" />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={i} className={`${getTypographyClassName("body-sm")} my-2 text-text-secondary`}>
            {trimmedLine}
          </p>
        );
      }
    }

    // Process any remaining table rows
    if (inTable && tableRows.length > 0) {
      const tableElement = processTableRows();
      if (tableElement) elements.push(tableElement);
    }

    return elements;
  };

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`${getTypographyClassName("body-sm")} text-green-700 dark:text-green-400 flex items-center gap-1`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Agreement generated
          </span>
          {generatedAt && (
            <span className={`${getTypographyClassName("body-sm")} text-text-muted`}>
              {new Date(generatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center gap-1`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy
              </>
            )}
          </button>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50 transition flex items-center gap-1`}
            >
              {isRegenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Regenerating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`${getTypographyClassName("button-sm")} px-2 py-1 rounded-md border border-black/10 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10 transition`}
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div 
        className={`border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-gray-950 overflow-hidden transition-all ${
          expanded ? "max-h-none" : "max-h-80"
        }`}
      >
        <div className={`p-4 ${!expanded ? "relative" : ""}`}>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderMarkdown(agreement)}
          </div>
          
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-950 to-transparent pointer-events-none" />
          )}
        </div>
      </div>

      {/* Quick tip */}
      <p className={`${getTypographyClassName("body-sm")} text-text-muted`}>
        Copy the agreement and paste into Google Docs to send for eSignature.
      </p>
    </div>
  );
}
