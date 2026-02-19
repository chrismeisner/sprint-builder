"use client";

import Link from "next/link";
import { useState } from "react";

interface SavedLocation {
  id: number;
  label: string;
  address: string;
  category: string;
}

const presetCategories = ["Home", "Work", "School", "Gym", "Custom"];

const initialLocations: SavedLocation[] = [
  { id: 1, label: "Home", address: "123 Oak St, Springfield", category: "Home" },
];

let nextId = 2;

export default function LocationsPage() {
  const [locations, setLocations] = useState<SavedLocation[]>(initialLocations);
  const [showForm, setShowForm] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategory, setFormCategory] = useState("Custom");
  const [editingId, setEditingId] = useState<number | null>(null);

  function saveLocation() {
    if (!formAddress.trim()) return;
    const label = formLabel.trim() || formCategory;

    if (editingId !== null) {
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === editingId
            ? { ...loc, label, address: formAddress.trim(), category: formCategory }
            : loc
        )
      );
      setEditingId(null);
    } else {
      setLocations((prev) => [
        ...prev,
        { id: nextId++, label, address: formAddress.trim(), category: formCategory },
      ]);
    }
    resetForm();
  }

  function startEdit(loc: SavedLocation) {
    setFormLabel(loc.label);
    setFormAddress(loc.address);
    setFormCategory(loc.category);
    setEditingId(loc.id);
    setShowForm(true);
  }

  function removeLocation(id: number) {
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  }

  function resetForm() {
    setFormLabel("");
    setFormAddress("");
    setFormCategory("Custom");
    setShowForm(false);
    setEditingId(null);
  }

  function iconForCategory(category: string) {
    if (category === "Home") {
      return (
        <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    }
    if (category === "Work") {
      return (
        <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      );
    }
    if (category === "School") {
      return (
        <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      );
    }
    if (category === "Gym") {
      return (
        <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    }
    return (
      <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium leading-none text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          <svg className="size-4" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Home
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Locations
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            Name the places you go most. Miles uses these to auto-label your
            trips and surface better insights.
          </p>
        </div>

        {/* Saved locations */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide leading-none text-neutral-500 dark:text-neutral-500">
            Your places
          </span>

          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950">
                {iconForCategory(loc.category)}
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                  {loc.label}
                </span>
                <span className="text-xs font-normal leading-normal text-neutral-500 dark:text-neutral-500">
                  {loc.address}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(loc)}
                  className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-700"
                  aria-label={`Edit ${loc.label}`}
                >
                  <svg className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </button>
                {loc.category !== "Home" && (
                  <button
                    type="button"
                    onClick={() => removeLocation(loc.id)}
                    className="flex size-8 items-center justify-center rounded-md motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-700"
                    aria-label={`Remove ${loc.label}`}
                  >
                    <svg className="size-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit form */}
        {showForm ? (
          <div className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <span className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
              {editingId !== null ? "Edit location" : "Add a location"}
            </span>

            {/* Category picker */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium leading-none text-neutral-500 dark:text-neutral-500">
                Type
              </span>
              <div className="flex flex-wrap gap-2">
                {presetCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFormCategory(cat);
                      if (cat !== "Custom" && !formLabel.trim()) setFormLabel(cat);
                    }}
                    className={`h-8 rounded-full px-3 text-xs font-medium leading-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      formCategory === cat
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <label htmlFor="loc-name" className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Name
              </label>
              <input
                id="loc-name"
                type="text"
                placeholder={formCategory !== "Custom" ? formCategory : "e.g. Grandma's house"}
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-2">
              <label htmlFor="loc-address" className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100">
                Address
              </label>
              <input
                id="loc-address"
                type="text"
                placeholder="Start typing an address..."
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="h-12 w-full rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-none text-neutral-900 placeholder:text-neutral-500 motion-safe:transition-colors focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400"
              />
            </div>

            {/* Form actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-neutral-300 bg-white px-4 text-sm font-medium leading-none text-neutral-900 motion-safe:transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveLocation}
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium leading-none text-white motion-safe:transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {editingId !== null ? "Save changes" : "Add location"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-6 text-base font-medium leading-none text-neutral-900 motion-safe:transition-colors motion-safe:duration-200 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            <svg className="size-5 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add a location
          </button>
        )}

        {/* Why this matters */}
        <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <svg className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none text-blue-700 dark:text-blue-400">
              Why name locations?
            </span>
            <span className="text-sm font-normal leading-normal text-blue-700 dark:text-blue-400">
              Named places make trip labels clearer (&ldquo;Home &rarr;
              Work&rdquo; instead of street addresses) and power features like
              arrival reminders and weekly commute stats.
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
        >
          Done
        </Link>
      </div>
    </main>
  );
}
