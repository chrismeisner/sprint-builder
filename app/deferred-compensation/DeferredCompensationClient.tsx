"use client";

import { useMemo, useState } from "react";
import Typography from "@/components/ui/Typography";

type SprintOption = {
  id: string;
  label: string;
};

type DeferredCompensationProps = {
  sprintOptions: SprintOption[];
  isLoggedIn: boolean;
  defaultSprintId?: string;
  defaultAmount?: number;
};

// Constants (guardrails)
const UPFRONT_MIN = 0.20; // 20%
const UPFRONT_MAX = 1.0;  // 100%
const EQUITY_SPLIT_MIN = 0; // allow 0% equity (100% of remaining deferred)
const EQUITY_SPLIT_MAX = 0.80; // cap equity at 80% (leave at least 20% deferred)

// Default values
const DEFAULT_PROJECT_VALUE = 10000; // $10,000

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumberInput(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function isValidDateString(value: string): boolean {
  return value !== "" && !Number.isNaN(Date.parse(value));
}

export default function DeferredCompensationClient({
  sprintOptions,
  isLoggedIn,
  defaultSprintId,
  defaultAmount,
}: DeferredCompensationProps) {
  const resolvedSprintOptions = useMemo(() => {
    if (!defaultSprintId) return sprintOptions;
    const exists = sprintOptions.some((opt) => opt.id === defaultSprintId);
    if (exists) return sprintOptions;
    return [
      ...sprintOptions,
      {
        id: defaultSprintId,
        label: `Sprint ${defaultSprintId.slice(0, 8)}`,
      },
    ];
  }, [sprintOptions, defaultSprintId]);

  // User inputs
  const [totalProjectValue, setTotalProjectValue] = useState(
    Number.isFinite(defaultAmount) && typeof defaultAmount === "number" ? defaultAmount : DEFAULT_PROJECT_VALUE
  );
  const [upfrontPayment, setUpfrontPayment] = useState(0.4);
  // This controls how the remaining (non-upfront) portion is split
  // 0 = all deferred, 1 = all equity
  const [equitySplit, setEquitySplit] = useState(0.5);
  const [milestones, setMilestones] = useState<
    { id: number; summary: string; multiplier: number; date: string }[]
  >([
    { id: 1, summary: "", multiplier: 1.5, date: "" },
    { id: 2, summary: "", multiplier: 2, date: "" },
  ]);
  const [milestoneMissOutcome, setMilestoneMissOutcome] = useState("renegotiate");
  const [selectedSprint, setSelectedSprint] = useState(defaultSprintId ?? "");
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [newMilestoneSummary, setNewMilestoneSummary] = useState("");
  const [newMilestoneMultiplier, setNewMilestoneMultiplier] = useState(1);
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [milestoneModalError, setMilestoneModalError] = useState("");
  const sprintLabelById = useMemo(
    () => new Map(resolvedSprintOptions.map((option) => [option.id, option.label])),
    [resolvedSprintOptions]
  );
  const selectedSprintLabel =
    selectedSprint && sprintLabelById.get(selectedSprint)
      ? sprintLabelById.get(selectedSprint)!
      : selectedSprint || "";

  // Calculated values
  const remainingPercent = 1 - upfrontPayment;
  const equityPercent = remainingPercent * equitySplit;
  const deferredPercent = remainingPercent * (1 - equitySplit);

  const upfrontAmount = upfrontPayment * totalProjectValue;
  const equityAmount = equityPercent * totalProjectValue;
  const deferredAmount = deferredPercent * totalProjectValue;
  const totalMilestoneMultiplier = milestones.reduce(
    (sum, m) => (m.multiplier > 0 ? sum + m.multiplier : sum),
    0
  );
  const milestoneBonusAmount = deferredAmount * totalMilestoneMultiplier;
  const calculatorDisabled = false;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [csvUploadError, setCsvUploadError] = useState<string | null>(null);
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      const payload = {
        sprintId: selectedSprint || defaultSprintId || "",
        inputs: {
          totalProjectValue,
          upfrontPayment,
          equitySplit,
          milestones,
          milestoneMissOutcome,
        },
        outputs: {
          upfrontAmount,
          equityAmount,
          deferredAmount,
          milestoneBonusAmount,
          totalProjectValue,
        },
        label: selectedSprintLabel || null,
      };

      if (!payload.sprintId) {
        throw new Error("Select a sprint to attach this budget.");
      }

      const res = await fetch("/api/deferred-comp-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save budget");
      }
      const savedAt = new Date().toLocaleString();
      setLastSavedAt(savedAt);
      setSaveSuccess("Budget saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleEmail = async () => {
    try {
      setEmailSending(true);
      setEmailError(null);
      setEmailSuccess(null);

      const recipients = emailTo
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter((e) => e.length > 0);

      if (recipients.length === 0) {
        throw new Error("Add at least one email address.");
      }

      const payload = {
        to: recipients,
        calculator: {
          totalProjectValue,
          upfrontPayment,
          equitySplit,
          milestones,
          milestoneMissOutcome,
          upfrontAmount,
          equityAmount,
          deferredAmount,
        },
      };

      const res = await fetch("/api/deferred-comp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send email");
      }

      setEmailSuccess("Email sent");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  };

  const downloadCsv = (fileName: string, rows: (string | number)[][]) => {
    const escapeCell = (value: string | number) => {
      const str = String(value ?? "");
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const csvContent = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvContent = (content: string): Map<string, string> => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const data = new Map<string, string>();
    
    for (const line of lines) {
      // Simple CSV parsing - handle quoted values
      const match = line.match(/^"?([^",]+)"?,\s*"?([^"]*)"?$/);
      if (match) {
        data.set(match[1].trim(), match[2].trim());
      }
    }
    return data;
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvUploadError(null);
    setCsvUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) {
          throw new Error("Failed to read file");
        }

        const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
        const data = parseCsvContent(content);

        // Parse Total Project Value
        const projectValueStr = data.get("Total Project Value");
        if (projectValueStr) {
          const projectValue = Number(projectValueStr.replace(/[$,]/g, ""));
          if (Number.isFinite(projectValue) && projectValue > 0) {
            setTotalProjectValue(projectValue);
          }
        }

        // Parse Upfront Percent
        const upfrontPercentStr = data.get("Upfront Percent");
        if (upfrontPercentStr) {
          const upfrontPct = Number(upfrontPercentStr.replace(/%/g, "")) / 100;
          if (Number.isFinite(upfrontPct) && upfrontPct >= UPFRONT_MIN && upfrontPct <= UPFRONT_MAX) {
            setUpfrontPayment(upfrontPct);
          }
        }

        // Parse Equity Percent (to calculate equity split)
        const equityPercentStr = data.get("Equity Percent");
        const deferredPercentStr = data.get("Deferred Percent");
        if (equityPercentStr && deferredPercentStr) {
          const equityPct = Number(equityPercentStr.replace(/%/g, "")) / 100;
          const deferredPct = Number(deferredPercentStr.replace(/%/g, "")) / 100;
          const remaining = equityPct + deferredPct;
          if (remaining > 0) {
            const newEquitySplit = equityPct / remaining;
            if (Number.isFinite(newEquitySplit) && newEquitySplit >= EQUITY_SPLIT_MIN && newEquitySplit <= EQUITY_SPLIT_MAX) {
              setEquitySplit(newEquitySplit);
            }
          }
        }

        // Parse Milestone Miss Outcome
        const missOutcome = data.get("Milestone Miss Outcome");
        if (missOutcome) {
          const outcomeMap: Record<string, string> = {
            "forgiven": "forgiven",
            "reduced to 50%": "reduced-50",
            "reduced-50": "reduced-50",
            "reduced to 20%": "reduced-20",
            "reduced-20": "reduced-20",
            "100% deferred still owed": "still-owed",
            "still-owed": "still-owed",
            "renegotiate": "renegotiate",
          };
          const mapped = outcomeMap[missOutcome.toLowerCase()];
          if (mapped) {
            setMilestoneMissOutcome(mapped);
          }
        }

        // Parse Milestones from the CSV
        // Find the milestone header row
        let milestonesStartIndex = -1;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes("milestones") && lines[i].toLowerCase().includes("summary")) {
            milestonesStartIndex = i + 1;
            break;
          }
        }

        if (milestonesStartIndex > 0) {
          const newMilestones: { id: number; summary: string; multiplier: number; date: string }[] = [];
          
          for (let i = milestonesStartIndex; i < lines.length; i++) {
            const line = lines[i];
            // Parse CSV row - handle quoted values
            const cells: string[] = [];
            let current = "";
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                cells.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            cells.push(current.trim());

            // Expected format: "", Summary, Date, Multiplier, ...
            if (cells.length >= 4) {
              const summary = cells[1] || "";
              const date = cells[2] || "";
              const multiplierStr = cells[3] || "";
              
              if (summary && summary !== "—") {
                const multiplier = Number(multiplierStr.replace(/x/g, ""));
                if (Number.isFinite(multiplier) && multiplier > 0) {
                  newMilestones.push({
                    id: Date.now() + i,
                    summary,
                    date: date === "—" ? "" : date,
                    multiplier,
                  });
                }
              }
            }
          }

          if (newMilestones.length > 0) {
            setMilestones(newMilestones);
          }
        }

        setCsvUploadSuccess("CSV imported successfully");
        setTimeout(() => setCsvUploadSuccess(null), 3000);
      } catch (err) {
        setCsvUploadError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };

    reader.onerror = () => {
      setCsvUploadError("Failed to read file");
    };

    reader.readAsText(file);
    
    // Reset the input so the same file can be uploaded again
    event.target.value = "";
  };

  const handleExportCsv = () => {
    const rows: (string | number)[][] = [];
    rows.push(["Field", "Value"]);
    rows.push(["Total Project Value", totalProjectValue]);
    rows.push(["Upfront Percent", formatPercent(upfrontPayment)]);
    rows.push(["Upfront Amount", upfrontAmount]);
    rows.push(["Equity Percent", formatPercent(equityPercent)]);
    rows.push(["Equity Amount", equityAmount]);
    rows.push(["Deferred Percent", formatPercent(deferredPercent)]);
    rows.push(["Deferred Amount", deferredAmount]);
    rows.push(["Milestone Miss Outcome", milestoneMissOutcome]);
    rows.push(["Selected Sprint", selectedSprintLabel]);

    rows.push([]);
    rows.push([
      "Milestones",
      "Summary",
      "Date",
      "Multiplier",
      "Upfront",
      "Equity",
      "Deferred Payout",
      "Total Project Cost",
    ]);

    const milestoneRows =
      milestones.length > 0
        ? milestones
        : [{ id: 0, summary: "—", date: "—", multiplier: "—" as unknown as number }];

    milestoneRows.forEach((m) => {
      const isNumberMultiplier = Number.isFinite(m.multiplier) && typeof m.multiplier === "number";
      const multiplier = isNumberMultiplier ? m.multiplier : "—";
      const deferredPayout = isNumberMultiplier ? deferredAmount * m.multiplier : null;
      const equityPayout = isNumberMultiplier ? equityAmount * m.multiplier : null;
      const totalCost =
        isNumberMultiplier && deferredPayout != null && equityPayout != null
          ? upfrontAmount + equityPayout + deferredPayout
          : null;
      rows.push([
        "",
        m.summary || "—",
        m.date || "—",
        multiplier,
        upfrontAmount,
        equityPayout ?? "—",
        deferredPayout ?? "—",
        totalCost ?? "—",
      ]);
    });

    downloadCsv("deferred-comp-calculator.csv", rows);
  };

  const handleAddMilestone = () => {
    const summary = newMilestoneSummary.trim();
    const multiplier = Math.max(0, Number(newMilestoneMultiplier) || 0);
    const date = newMilestoneDate;

    if (!summary) {
      setMilestoneModalError("Summary is required.");
      return;
    }
    if (multiplier <= 0) {
      setMilestoneModalError("Multiplier must be greater than 0.");
      return;
    }
    if (!isValidDateString(date)) {
      setMilestoneModalError("Valid milestone date is required.");
      return;
    }

    setMilestones((prev) => [
      ...prev,
      { id: Date.now(), summary, multiplier, date },
    ]);
    setNewMilestoneSummary("");
    setNewMilestoneMultiplier(1);
    setNewMilestoneDate("");
    setMilestoneModalError("");
    setIsMilestoneModalOpen(false);
  };

  // Colors
  const COLORS = {
    upfront: "#14b8a6", // teal
    equity: "#8b5cf6",  // purple
    deferred: "#f59e0b", // amber
  };

  // Pie chart segments
  const pieSegments = [
    { label: "Upfront", percent: upfrontPayment, color: COLORS.upfront },
    { label: "Equity", percent: equityPercent, color: COLORS.equity },
    { label: "Deferred (base/1x)", percent: deferredPercent, color: COLORS.deferred },
  ];

  return (
    <main className="container py-10 space-y-10 max-w-5xl">
      <header className="space-y-2">
        <Typography as="h1" scale="h2" className="text-text-primary">
          🔮 Deferred Compensation Calculator
        </Typography>
        <Typography as="p" scale="body-md" className="text-text-secondary">
          Calculate upfront, equity, and deferred payment structures for project engagements.
        </Typography>
      </header>


      {/* Project Budget */}
      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <Typography as="h2" scale="h3" className="text-text-primary">
          Project Budget
        </Typography>
        <div className="rounded-lg bg-surface-subtle p-4 space-y-2">
          <label htmlFor="totalProjectValue">
            <Typography as="span" scale="subtitle-sm" className="text-text-secondary">
              Total Project Value
            </Typography>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
            <input
              id="totalProjectValue"
              type="text"
              inputMode="numeric"
              value={formatNumberInput(totalProjectValue)}
              onChange={(e) => {
                const numeric = Number(e.target.value.replace(/,/g, ""));
                setTotalProjectValue(Math.max(0, Number.isFinite(numeric) ? numeric : 0));
              }}
              className="w-full rounded-md border border-stroke-muted bg-background pl-7 pr-3 py-2 text-lg font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
      </section>

      {/* Milestone Table */}
      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Typography as="h2" scale="h3" className="text-text-primary">
              Milestones
            </Typography>
            <Typography as="p" scale="body-sm" className="text-text-secondary">
              Each milestone defines a summary and a multiplier on the deferred amount.
            </Typography>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewMilestoneSummary("");
              setNewMilestoneMultiplier(1);
              setNewMilestoneDate("");
              setMilestoneModalError("");
              setIsMilestoneModalOpen(true);
            }}
            className="rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm font-medium text-text-primary hover:border-text-secondary"
          >
            Add milestone
          </button>
        </div>

        <div className="space-y-3">
          {milestones.map((milestone) => {
            return (
              <div
                key={milestone.id}
                className="rounded-lg border border-stroke-muted bg-surface-subtle p-3 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-4 sm:items-center">
                  <div className="sm:col-span-2 space-y-1">
                    <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                      Summary
                    </Typography>
                    <input
                      type="text"
                      value={milestone.summary}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, summary: e.target.value } : m
                          )
                        )
                      }
                      className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      placeholder="Describe the milestone"
                    />
                  </div>
                  <div className="space-y-1">
                    <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                      Date
                    </Typography>
                    <input
                      type="date"
                      value={milestone.date}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id ? { ...m, date: e.target.value } : m
                          )
                        )
                      }
                      className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                      Multiplier (x Deferred)
                    </Typography>
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={milestone.multiplier}
                      onChange={(e) =>
                        setMilestones((prev) =>
                          prev.map((m) =>
                            m.id === milestone.id
                              ? { ...m, multiplier: Math.max(0, Number(e.target.value) || 0) }
                              : m
                          )
                        )
                      }
                      className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))
                    }
                    className="text-sm text-text-secondary hover:text-text-primary"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-stroke-muted bg-surface-subtle p-4 space-y-2">
          <Typography as="h3" scale="subtitle-sm" className="text-text-primary">
            If no milestones are hit
          </Typography>
          <Typography as="p" scale="body-sm" className="text-text-secondary">
            Choose what happens to the deferred payment (and equity) if none of the milestones are achieved.
          </Typography>
          <select
            value={milestoneMissOutcome}
            onChange={(e) => setMilestoneMissOutcome(e.target.value)}
            className="mt-1 w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="forgiven">Forgiven</option>
            <option value="reduced-50">Reduced to 50%</option>
            <option value="reduced-20">Reduced to 20%</option>
            <option value="still-owed">100% deferred still owed</option>
            <option value="renegotiate">Renegotiate</option>
          </select>
        </div>
      </section>

      {/* Payment Split Controls */}
      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-8">
        <div className="space-y-1">
          <Typography as="h2" scale="h3" className="text-text-primary">
            Payment Structure
          </Typography>
          <Typography as="p" scale="body-sm" className="text-text-secondary">
            Adjust how the total project value is split across payment types.
          </Typography>
        </div>

        {/* Upfront Payment Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography as="span" scale="body-sm" className="font-medium text-text-primary">
              Upfront Payment
            </Typography>
            <Typography as="span" scale="body-sm" className="text-text-secondary">
              {formatPercent(UPFRONT_MIN)} – {formatPercent(UPFRONT_MAX)} allowed
            </Typography>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min={UPFRONT_MIN}
              max={UPFRONT_MAX}
              step={0.01}
              value={upfrontPayment}
              onChange={(e) => setUpfrontPayment(Number(e.target.value))}
              disabled={calculatorDisabled}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: `linear-gradient(to right, ${COLORS.upfront} 0%, ${COLORS.upfront} ${((upfrontPayment - UPFRONT_MIN) / (UPFRONT_MAX - UPFRONT_MIN)) * 100}%, var(--color-surface-subtle) ${((upfrontPayment - UPFRONT_MIN) / (UPFRONT_MAX - UPFRONT_MIN)) * 100}%, var(--color-surface-subtle) 100%)`,
                accentColor: COLORS.upfront,
              }}
            />
            <div className="w-24 text-right">
              <Typography as="span" scale="h3" style={{ color: COLORS.upfront }}>
                {formatPercent(upfrontPayment)}
              </Typography>
            </div>
          </div>

          <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: `${COLORS.upfront}1a` }}>
            <Typography as="span" scale="body-sm" style={{ color: COLORS.upfront }}>
              Upfront ({formatPercent(upfrontPayment)})
            </Typography>
            <Typography as="span" scale="body-sm" className="font-medium" style={{ color: COLORS.upfront }}>
              {formatCurrency(upfrontAmount)}
            </Typography>
          </div>
        </div>

        {/* Equity vs Deferred Split Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Typography as="span" scale="body-sm" className="font-medium text-text-primary">
              Remaining Split: Equity ↔ Deferred
            </Typography>
            <Typography as="span" scale="body-sm" className="text-text-secondary">
              {formatPercent(remainingPercent)} to allocate ({formatPercent(EQUITY_SPLIT_MIN)} equity – {formatPercent(EQUITY_SPLIT_MAX)} equity allowed, at least {formatPercent(1 - EQUITY_SPLIT_MAX)} deferred)
            </Typography>
          </div>

          <div className="flex items-center gap-4">
            <Typography as="span" scale="subtitle-sm" style={{ color: COLORS.deferred }} className="w-16">
              Deferred
            </Typography>
            <input
              type="range"
              min={EQUITY_SPLIT_MIN}
              max={EQUITY_SPLIT_MAX}
              step={0.01}
              value={equitySplit}
              onChange={(e) =>
                setEquitySplit(
                  Math.min(
                    EQUITY_SPLIT_MAX,
                    Math.max(EQUITY_SPLIT_MIN, Number(e.target.value))
                  )
                )
              }
              disabled={calculatorDisabled}
              className="flex-1 h-2 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--color-surface-subtle)",
                accentColor: COLORS.equity,
              }}
            />
            <Typography as="span" scale="subtitle-sm" style={{ color: COLORS.equity }} className="w-16 text-right">
              Equity
            </Typography>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: `${COLORS.deferred}1a` }}>
              <Typography as="span" scale="body-sm" style={{ color: COLORS.deferred }}>
                Deferred (base/1x) ({formatPercent(deferredPercent)})
              </Typography>
              <Typography as="span" scale="body-sm" className="font-medium" style={{ color: COLORS.deferred }}>
                {formatCurrency(deferredAmount)}
              </Typography>
            </div>
            <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: `${COLORS.equity}1a` }}>
              <Typography as="span" scale="body-sm" style={{ color: COLORS.equity }}>
                Equity ({formatPercent(equityPercent)})
              </Typography>
              <Typography as="span" scale="body-sm" className="font-medium" style={{ color: COLORS.equity }}>
                {formatCurrency(equityAmount)}
              </Typography>
            </div>
          </div>

        </div>
      </section>

      {isMilestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <Typography as="h3" scale="h4" className="text-text-primary">
                Add milestone
              </Typography>
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                  Summary
                </Typography>
                <input
                  type="text"
                  value={newMilestoneSummary}
                  onChange={(e) => setNewMilestoneSummary(e.target.value)}
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Describe the milestone"
                />
              </div>
              <div className="space-y-1">
                <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                  Multiplier (x Deferred)
                </Typography>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={newMilestoneMultiplier}
                  onChange={(e) =>
                    setNewMilestoneMultiplier(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div className="space-y-1">
                <Typography as="label" scale="subtitle-sm" className="text-text-secondary">
                  Milestone date
                </Typography>
                <input
                  type="date"
                  value={newMilestoneDate}
                  onChange={(e) => setNewMilestoneDate(e.target.value)}
                  className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              {milestoneModalError && (
                <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {milestoneModalError}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMilestoneModalOpen(false)}
                className="rounded-md border border-stroke-muted bg-background px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMilestone}
                className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Add milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual Breakdown */}
      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <Typography as="h2" scale="h3" className="text-text-primary">
          Visual Breakdown
        </Typography>

        {/* Stacked Bar */}
        <div className="space-y-2">
          <div className="h-12 rounded-lg overflow-hidden flex">
            {pieSegments.map((seg, i) => (
              <div
                key={i}
                className="flex items-center justify-center text-white text-sm font-medium transition-all duration-300"
                style={{
                  width: `${seg.percent * 100}%`,
                  backgroundColor: seg.color,
                  minWidth: seg.percent > 0 ? "2rem" : 0,
                }}
              >
                {seg.percent >= 0.1 && formatPercent(seg.percent)}
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            {pieSegments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seg.color }}
                />
                <Typography as="span" scale="subtitle-sm" className="text-text-secondary">
                  {seg.label}
                </Typography>
              </div>
            ))}
          </div>
        </div>

        {/* Numeric breakdown table */}
        <div className="overflow-hidden rounded-lg border border-stroke-muted">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-subtle text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Percent</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-muted">
              <tr>
                <td className="px-4 py-3">
                  <Typography as="span" scale="body-sm" className="text-text-primary">
                    Upfront
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatPercent(upfrontPayment)}
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatCurrency(upfrontAmount)}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Typography as="span" scale="body-sm" className="text-text-primary">
                    Equity
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatPercent(equityPercent)}
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatCurrency(equityAmount)}
                  </Typography>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Typography as="span" scale="body-sm" className="text-text-primary">
                    Deferred (base/1x)
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatPercent(deferredPercent)}
                  </Typography>
                </td>
                <td className="px-4 py-3 text-right">
                  <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                    {formatCurrency(deferredAmount)}
                  </Typography>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Milestones Readout */}
      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <Typography as="h2" scale="h3" className="text-text-primary">
            Milestones Readout
          </Typography>
          <Typography as="p" scale="body-sm" className="text-text-secondary">
            A summary of milestones added on this page.
          </Typography>
        </div>
        {milestones.length === 0 ? (
          <div className="rounded-md border border-stroke-muted bg-surface-subtle px-4 py-3 text-sm text-text-secondary">
            No milestones added yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stroke-muted">
            <table className="w-full text-left">
              <thead className="bg-surface-subtle text-text-secondary text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Summary</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Multiplier</th>
                  <th className="px-4 py-3 font-medium text-right">Upfront</th>
                  <th className="px-4 py-3 font-medium text-right">Equity</th>
                  <th className="px-4 py-3 font-medium text-right">Deferred Payout</th>
                  <th className="px-4 py-3 font-medium text-right">Total Project Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke-muted">
                {milestones.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <Typography as="span" scale="body-sm" className="text-text-primary">
                        {m.summary || "—"}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">
                      <Typography as="span" scale="body-sm" className="text-text-secondary">
                        {m.date || "—"}
                      </Typography>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                        {Number.isFinite(m.multiplier) ? `${m.multiplier}x` : "—"}
                      </Typography>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                        {formatCurrency(upfrontAmount)}
                      </Typography>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                      {Number.isFinite(m.multiplier)
                        ? formatCurrency(equityAmount * m.multiplier)
                        : "—"}
                      </Typography>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                        {Number.isFinite(m.multiplier) ? formatCurrency(deferredAmount * m.multiplier) : "—"}
                      </Typography>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Typography as="span" scale="body-sm" className="text-text-primary font-medium">
                        {Number.isFinite(m.multiplier)
                          ? formatCurrency(
                              upfrontAmount + equityAmount * m.multiplier + deferredAmount * m.multiplier
                            )
                          : "—"}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Typography as="h2" scale="h3" className="text-text-primary">
            Import / Export
          </Typography>
          <div className="flex items-center gap-2">
            <label className="rounded-md border border-stroke-muted bg-background px-4 py-2 text-sm font-medium text-text-primary hover:border-text-secondary cursor-pointer">
              Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Export CSV
            </button>
          </div>
        </div>
        <Typography as="p" scale="body-sm" className="text-text-secondary">
          Upload a previously exported CSV to restore settings, or download a snapshot of the current calculation.
        </Typography>
        {csvUploadError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {csvUploadError}
          </div>
        )}
        {csvUploadSuccess && (
          <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
            {csvUploadSuccess}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Typography as="h2" scale="h3" className="text-text-primary">
            Email
          </Typography>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEmail}
              disabled={emailSending}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-60"
            >
              {emailSending ? "Sending..." : "Email this"}
            </button>
          </div>
        </div>
        <Typography as="p" scale="body-sm" className="text-text-secondary">
          Email the current calculator state to yourself or others.
        </Typography>
        <div className="space-y-2">
          <label htmlFor="emailRecipients">
            <Typography as="span" scale="subtitle-sm" className="text-text-secondary">
              Email recipients
            </Typography>
          </label>
          <input
            id="emailRecipients"
            type="text"
            placeholder="name@example.com, team@company.com"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          {emailError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {emailError}
            </div>
          )}
          {emailSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {emailSuccess}
            </div>
          )}
        </div>
      </section>

      {/* Save / Update */}
      {isLoggedIn && (
        <section className="rounded-xl border border-stroke-muted bg-surface-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <Typography as="h2" scale="h3" className="text-text-primary">
                Budget save
              </Typography>
              {lastSavedAt ? (
                <Typography as="p" scale="body-sm" className="text-text-secondary">
                  Last modified: {lastSavedAt}
                </Typography>
              ) : (
                <Typography as="p" scale="body-sm" className="text-text-secondary">
                  Not saved yet.
                </Typography>
              )}
            </div>
            {selectedSprint && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !selectedSprint}
                  className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/80 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save budget"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="selectedSprintSave">
              <Typography as="span" scale="subtitle-sm" className="text-text-secondary">
                Project to attach budget
              </Typography>
            </label>
            {resolvedSprintOptions.length > 0 ? (
              <select
                id="selectedSprintSave"
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                className="w-full rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">Select your project</option>
                {resolvedSprintOptions.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-md border border-stroke-muted bg-background px-3 py-2 text-sm text-text-secondary">
                No projects found for your account yet.
              </div>
            )}
          </div>

          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {saveSuccess}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
