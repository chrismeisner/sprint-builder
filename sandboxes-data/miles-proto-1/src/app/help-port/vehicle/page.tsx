"use client";

import Link from "next/link";
import { useState } from "react";

const makes = ["Acura", "BMW", "Chevrolet", "Dodge", "Ford", "Honda", "Hyundai", "Jeep", "Kia", "Lexus", "Mazda", "Mercedes-Benz", "Nissan", "Ram", "Subaru", "Tesla", "Toyota", "Volkswagen"];

const modelsByMake: Record<string, string[]> = {
  Acura: ["ILX", "MDX", "RDX", "TLX"],
  BMW: ["3 Series", "5 Series", "X3", "X5"],
  Chevrolet: ["Camaro", "Equinox", "Malibu", "Silverado", "Tahoe"],
  Dodge: ["Challenger", "Charger", "Durango"],
  Ford: ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Mustang"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Pilot"],
  Hyundai: ["Elantra", "Kona", "Santa Fe", "Sonata", "Tucson"],
  Jeep: ["Cherokee", "Compass", "Grand Cherokee", "Wrangler"],
  Kia: ["Forte", "K5", "Seltos", "Sorento", "Sportage", "Telluride"],
  Lexus: ["ES", "IS", "NX", "RX"],
  Mazda: ["CX-5", "CX-50", "Mazda3", "MX-5 Miata"],
  "Mercedes-Benz": ["C-Class", "E-Class", "GLA", "GLC", "GLE"],
  Nissan: ["Altima", "Kicks", "Pathfinder", "Rogue", "Sentra"],
  Ram: ["1500", "2500", "ProMaster"],
  Subaru: ["Crosstrek", "Forester", "Impreza", "Outback", "WRX"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: ["Camry", "Corolla", "Highlander", "RAV4", "Tacoma", "Tundra"],
  Volkswagen: ["Atlas", "Golf", "ID.4", "Jetta", "Tiguan"],
};

const years = Array.from({ length: 30 }, (_, i) => String(2025 - i));

const portLocations: Record<string, string> = {
  default: "under the dashboard on the driver's side, just above the knee area",
  BMW: "in the lower-left area of the dashboard, behind a small flip-down panel",
  "Mercedes-Benz": "behind a trim panel below the steering column — look for a small rectangular cover",
  Tesla: "inside the center console, below the touchscreen — you'll need a small adapter",
  Jeep: "under the steering column, slightly to the left — may be behind a removable panel",
};

function getPortLocation(make: string): string {
  return portLocations[make] || portLocations.default;
}

export default function VehiclePickerPage() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [showResult, setShowResult] = useState(false);

  const models = make ? modelsByMake[make] || [] : [];
  const canSearch = make && model && year;

  function handleMakeChange(value: string) {
    setMake(value);
    setModel("");
    setShowResult(false);
  }

  function handleSearch() {
    if (canSearch) setShowResult(true);
  }

  return (
    <main className="flex min-h-dvh flex-col px-6 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/help-port"
            className="text-sm font-medium leading-none text-blue-600 dark:text-blue-400 motion-safe:transition-colors motion-safe:duration-150 hover:text-blue-700 dark:hover:text-blue-300"
          >
            &larr; Back
          </Link>
          <h1 className="text-4xl font-semibold leading-tight text-balance text-neutral-900 dark:text-neutral-100">
            Select your vehicle
          </h1>
          <p className="text-base font-normal leading-normal text-pretty text-neutral-600 dark:text-neutral-400">
            We&rsquo;ll show you exactly where the OBD-II port is for your car.
          </p>
        </div>

        {/* Vehicle picker */}
        <div className="flex flex-col gap-4">
          {/* Make */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="make"
              className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
            >
              Make
            </label>
            <select
              id="make"
              value={make}
              onChange={(e) => handleMakeChange(e.target.value)}
              className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <option value="">Select make…</option>
              {makes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="model"
              className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
            >
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setShowResult(false);
              }}
              disabled={!make}
              className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <option value="">Select model…</option>
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="year"
              className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-100"
            >
              Year
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setShowResult(false);
              }}
              disabled={!model}
              className="h-12 rounded-md border border-neutral-300 bg-white px-4 text-base font-normal leading-normal text-neutral-900 tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              <option value="">Select year…</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch}
            className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
          >
            Find my port
          </button>
        </div>

        {/* Result panel */}
        {showResult && (
          <div className="flex flex-col gap-4">
            {/* Result card */}
            <div className="flex flex-col gap-4 rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-center gap-3">
                <svg
                  className="size-6 shrink-0 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-sm font-medium leading-none text-green-700 dark:text-green-400">
                  Vehicle found
                </span>
              </div>
              <p className="text-base font-normal leading-normal text-pretty text-green-700 dark:text-green-400">
                For your{" "}
                <span className="font-semibold">
                  {year} {make} {model}
                </span>
                , the OBD-II port is located{" "}
                {getPortLocation(make)}.
              </p>
            </div>

            {/* Reference image */}
            <div className="overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700">
              <img
                src="/journey-first-trip-1b.jpg"
                alt={`OBD-II port location reference for ${year} ${make} ${model}`}
                className="w-full"
              />
            </div>

            {/* CTA */}
            <Link
              href="/find-port"
              className="flex h-12 w-full items-center justify-center rounded-md bg-blue-600 px-6 text-base font-medium leading-none text-white motion-safe:transition-colors motion-safe:duration-200 motion-safe:ease-out hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-neutral-900"
            >
              Got it &mdash; back to install
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
