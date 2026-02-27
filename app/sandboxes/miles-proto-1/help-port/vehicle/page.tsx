"use client";

import Link from "@/app/sandboxes/miles-proto-1/_components/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { p } from "@/app/sandboxes/miles-proto-1/_lib/nav";

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


export default function VehiclePickerPage() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const models = make ? modelsByMake[make] || [] : [];
  const canSearch = make && model && year;

  function handleMakeChange(value: string) {
    setMake(value);
    setModel("");
  }

  function handleSearch() {
    if (canSearch) {
      const params = new URLSearchParams({ make, model, year });
      router.push(p(`/help-port/vehicle/result?${params.toString()}`));
    }
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
      </div>
    </main>
  );
}
