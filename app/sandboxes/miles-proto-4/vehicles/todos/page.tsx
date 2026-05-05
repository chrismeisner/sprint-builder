"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VehicleDetailShell } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-shell";
import { getVehicleData } from "@/app/sandboxes/miles-proto-4/_components/vehicle-detail-body";

interface TodoItem {
  id: string;
  title: string;
  subtitle: string;
  type: "setup" | "near-term" | "long-horizon";
  completed: boolean;
  mileage?: string;
}

const INITIAL_TODOS: TodoItem[] = [
  { id: "insurance", title: "Upload insurance card", subtitle: "Needed for roadside assistance", type: "setup", completed: false },
  { id: "emergency", title: "Set emergency contact", subtitle: "Shared with first responders in a crash", type: "setup", completed: false },
  { id: "oil", title: "Oil change", subtitle: "Due in ~800 mi", type: "near-term", completed: false, mileage: "~800 mi" },
  { id: "tires", title: "Tire rotation", subtitle: "Overdue by ~500 mi", type: "near-term", completed: false, mileage: "overdue" },
  { id: "brakes", title: "Brake pad inspection", subtitle: "Due in ~3,200 mi", type: "near-term", completed: false, mileage: "~3,200 mi" },
  { id: "coolant", title: "Coolant flush", subtitle: "At 50,000 mi (~12,800 mi away)", type: "long-horizon", completed: false, mileage: "~12,800 mi" },
  { id: "timing", title: "Timing belt replacement", subtitle: "At 60,000 mi (~22,800 mi away)", type: "long-horizon", completed: false, mileage: "~22,800 mi" },
  { id: "transmission", title: "Transmission fluid", subtitle: "At 60,000 mi (~22,800 mi away)", type: "long-horizon", completed: false, mileage: "~22,800 mi" },
];

const TYPE_LABELS: Record<TodoItem["type"], string> = {
  setup: "Setup",
  "near-term": "Maintenance",
  "long-horizon": "Upcoming",
};

const TYPE_ORDER: TodoItem["type"][] = ["setup", "near-term", "long-horizon"];

const typeDot: Record<TodoItem["type"], string> = {
  setup: "bg-blue-500",
  "near-term": "bg-amber-500",
  "long-horizon": "bg-neutral-300",
};

function VehicleTodosContent() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicle") ?? "civic";
  const vehicle = getVehicleData(vehicleId);
  const inferredName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  const [items, setItems] = useState(INITIAL_TODOS);
  const [filter, setFilter] = useState<"all" | TodoItem["type"]>("all");

  function toggleComplete(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: filtered.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <VehicleDetailShell eyebrow={inferredName} title="To-Do">
      <div className="-mt-1 flex flex-col gap-5">
        <span className="text-xs text-neutral-500">
          {completedCount} of {items.length} complete
        </span>

        {/* Filter pills */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {(["all", "setup", "near-term", "long-horizon"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium leading-none transition-colors ${
                filter === f
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f === "all" ? "All" : TYPE_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Grouped items */}
        <div className="flex flex-col gap-5">
          {grouped.map((group) => (
            <div key={group.type} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${typeDot[group.type]}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                  {group.label}
                </span>
              </div>
              <div className="flex flex-col divide-y divide-neutral-100 rounded-xl border border-neutral-200 bg-white">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3.5 ${
                      item.type === "long-horizon" && !item.completed ? "opacity-60" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleComplete(item.id)}
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                        item.completed
                          ? "border-green-500 bg-green-500"
                          : "border-neutral-300 bg-white hover:border-neutral-400"
                      }`}
                    >
                      {item.completed && (
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex flex-1 flex-col gap-1">
                      <span
                        className={`text-sm font-medium leading-none ${
                          item.completed
                            ? "text-neutral-400 line-through"
                            : "text-neutral-900"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-xs text-neutral-500">{item.subtitle}</span>
                    </div>

                    {item.mileage && !item.completed && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          item.mileage === "overdue"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {item.mileage}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-3.5 text-neutral-400">
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          <span className="text-sm">
            Items are added from maintenance schedules, the Miles agent, or manually
          </span>
        </div>
      </div>
    </VehicleDetailShell>
  );
}

export default function VehicleTodosPage() {
  return (
    <Suspense>
      <VehicleTodosContent />
    </Suspense>
  );
}
