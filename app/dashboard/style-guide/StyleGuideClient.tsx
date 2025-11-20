"use client";

import { useState } from "react";

type TabType = "typography" | "buttons" | "colors" | "forms" | "spacing";

export default function StyleGuideClient() {
  const [selectedTab, setSelectedTab] = useState<TabType>("typography");

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Design System Style Guide</h1>
        <p className="text-base opacity-70">
          A comprehensive reference for typography, colors, components, and design tokens used throughout the application.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-black/10 dark:border-white/15 mb-8">
        <nav className="flex gap-6">
          {[
            { id: "typography" as const, label: "Typography" },
            { id: "buttons" as const, label: "Buttons" },
            { id: "colors" as const, label: "Colors" },
            { id: "forms" as const, label: "Forms" },
            { id: "spacing" as const, label: "Spacing" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? "border-black dark:border-white text-black dark:text-white"
                  : "border-transparent text-black/60 dark:text-white/60 hover:text-black/80 dark:hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="space-y-12">
        {/* Typography Section */}
        {selectedTab === "typography" && (
          <section>
            <div className="space-y-12">
              {/* Font Families */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Font Families
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-sm font-medium opacity-60 mb-2">Display Font</p>
                    <p className="text-3xl font-gt-america mb-2">GT America Condensed Black</p>
                    <p className="text-sm opacity-70 mb-3">Used for all h1 headings and major display text</p>
                    <p className="text-2xl font-gt-america mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-base font-gt-america opacity-80">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p className="text-base font-gt-america opacity-80">abcdefghijklmnopqrstuvwxyz</p>
                    <p className="text-base font-gt-america opacity-80">0123456789</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-3">
                      font-family: var(--font-gt-america)
                    </code>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-2">
                      Tailwind: font-gt-america
                    </code>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-sm font-medium opacity-60 mb-2">Primary Font</p>
                    <p className="text-3xl font-akkurat font-semibold mb-2">Akkurat Pro</p>
                    <p className="text-sm opacity-70 mb-3">Default body text with Regular (400) and Bold (700) weights, including italics</p>
                    <p className="text-2xl font-akkurat mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-2xl font-akkurat font-bold mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-2xl font-akkurat italic mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-base font-akkurat opacity-80">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p className="text-base font-akkurat opacity-80">abcdefghijklmnopqrstuvwxyz</p>
                    <p className="text-base font-akkurat opacity-80">0123456789</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-3">
                      font-family: var(--font-akkurat)
                    </code>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-2">
                      Tailwind: font-akkurat or font-sans (default)
                    </code>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-sm font-medium opacity-60 mb-2">Light Font</p>
                    <p className="text-3xl font-akkurat-light mb-2">Akkurat Light Pro</p>
                    <p className="text-sm opacity-70 mb-3">Lighter weight (300) for subtle emphasis and delicate text</p>
                    <p className="text-2xl font-akkurat-light mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-2xl font-akkurat-light italic mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-base font-akkurat-light opacity-80">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p className="text-base font-akkurat-light opacity-80">abcdefghijklmnopqrstuvwxyz</p>
                    <p className="text-base font-akkurat-light opacity-80">0123456789</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-3">
                      font-family: var(--font-akkurat-light)
                    </code>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-2">
                      Tailwind: font-akkurat-light
                    </code>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <p className="text-sm font-medium opacity-60 mb-2">Monospace (Code)</p>
                    <p className="text-2xl font-mono mb-2">Akkurat Mono</p>
                    <p className="text-sm opacity-70 mb-3">Used for code snippets, technical content, and monospace text</p>
                    <p className="text-lg font-mono mb-2">The quick brown fox jumps over the lazy dog</p>
                    <p className="text-base font-mono opacity-80">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p className="text-base font-mono opacity-80">abcdefghijklmnopqrstuvwxyz</p>
                    <p className="text-base font-mono opacity-80">0123456789 !@#$%^&*()</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-3">
                      font-family: var(--font-akkurat-mono)
                    </code>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block mt-2">
                      Tailwind: font-akkurat-mono or font-mono
                    </code>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-blue-600/10 dark:bg-blue-400/10 border border-blue-600/20 dark:border-blue-400/20">
                  <p className="text-sm">
                    <span className="font-semibold">✨ Best Practice:</span> Custom fonts are loaded via{" "}
                    <code className="bg-black/10 dark:bg-white/20 px-1.5 py-0.5 rounded text-xs">next/font/local</code>{" "}
                    for optimal performance with automatic font optimization, self-hosting, and zero layout shift.
                  </p>
                </div>
              </div>

              {/* Typography Scale */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Typography Scale
                </h2>
                <div className="space-y-6">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-6xl</code>
                      <span className="text-xs opacity-60">60px / 3.75rem</span>
                    </div>
                    <h1 className="text-6xl font-bold">Heading 1</h1>
                    <p className="text-sm opacity-70 mt-2">Used for hero sections and major page titles</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-5xl</code>
                      <span className="text-xs opacity-60">48px / 3rem</span>
                    </div>
                    <h1 className="text-5xl font-bold">Heading 2</h1>
                    <p className="text-sm opacity-70 mt-2">Used for large section headers</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-4xl</code>
                      <span className="text-xs opacity-60">36px / 2.25rem</span>
                    </div>
                    <h2 className="text-4xl font-semibold">Heading 3</h2>
                    <p className="text-sm opacity-70 mt-2">Used for prominent section headers</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-3xl</code>
                      <span className="text-xs opacity-60">30px / 1.875rem</span>
                    </div>
                    <h3 className="text-3xl font-semibold">Heading 4</h3>
                    <p className="text-sm opacity-70 mt-2">Used for page titles and major sections</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-2xl</code>
                      <span className="text-xs opacity-60">24px / 1.5rem</span>
                    </div>
                    <h4 className="text-2xl font-semibold">Heading 5</h4>
                    <p className="text-sm opacity-70 mt-2">Used for subsection headers</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-xl</code>
                      <span className="text-xs opacity-60">20px / 1.25rem</span>
                    </div>
                    <h5 className="text-xl font-semibold">Heading 6</h5>
                    <p className="text-sm opacity-70 mt-2">Used for smaller section headers</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-lg</code>
                      <span className="text-xs opacity-60">18px / 1.125rem</span>
                    </div>
                    <p className="text-lg">Large body text</p>
                    <p className="text-sm opacity-70 mt-2">Used for emphasis and lead paragraphs</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-base</code>
                      <span className="text-xs opacity-60">16px / 1rem</span>
                    </div>
                    <p className="text-base">Base body text</p>
                    <p className="text-sm opacity-70 mt-2">The default size for body content</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-sm</code>
                      <span className="text-xs opacity-60">14px / 0.875rem</span>
                    </div>
                    <p className="text-sm">Small text</p>
                    <p className="text-sm opacity-70 mt-2">Used for secondary information and captions</p>
                  </div>

                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="flex items-baseline justify-between mb-2">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">text-xs</code>
                      <span className="text-xs opacity-60">12px / 0.75rem</span>
                    </div>
                    <p className="text-xs">Extra small text</p>
                    <p className="text-sm opacity-70 mt-2">Used for labels and metadata</p>
                  </div>
                </div>
              </div>

              {/* Font Weights */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Font Weights
                </h2>
                <div className="space-y-4">
                  {[
                    { class: "font-normal", label: "Normal (400)", weight: "400" },
                    { class: "font-medium", label: "Medium (500)", weight: "500" },
                    { class: "font-semibold", label: "Semibold (600)", weight: "600" },
                    { class: "font-bold", label: "Bold (700)", weight: "700" },
                  ].map((item) => (
                    <div key={item.class} className="p-4 rounded-lg border border-black/10 dark:border-white/15">
                      <div className="flex items-center justify-between">
                        <p className={`text-2xl ${item.class}`}>{item.label}</p>
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{item.class}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Line Heights */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Line Heights
                </h2>
                <div className="space-y-4">
                  {[
                    { class: "leading-none", label: "None (1)", value: "1" },
                    { class: "leading-tight", label: "Tight (1.25)", value: "1.25" },
                    { class: "leading-snug", label: "Snug (1.375)", value: "1.375" },
                    { class: "leading-normal", label: "Normal (1.5)", value: "1.5" },
                    { class: "leading-relaxed", label: "Relaxed (1.625)", value: "1.625" },
                    { class: "leading-loose", label: "Loose (2)", value: "2" },
                  ].map((item) => (
                    <div key={item.class} className="p-4 rounded-lg border border-black/10 dark:border-white/15">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{item.class}</code>
                      </div>
                      <p className={`text-base ${item.class}`}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Buttons Section */}
        {selectedTab === "buttons" && (
          <section>
            <div className="space-y-12">
              {/* Primary Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Primary Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for primary actions and call-to-actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-3 text-base font-medium hover:opacity-90 transition-opacity">
                        Large Button
                      </button>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
                        Medium Button
                      </button>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity">
                        Small Button
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-black dark:bg-white text-white dark:text-black hover:opacity-90
                    </code>
                  </div>
                </div>
              </div>

              {/* Secondary Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Secondary Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for secondary actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-6 py-3 text-base font-medium transition-colors">
                        Large Button
                      </button>
                      <button className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-4 py-2 text-sm font-medium transition-colors">
                        Medium Button
                      </button>
                      <button className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors">
                        Small Button
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10
                    </code>
                  </div>
                </div>
              </div>

              {/* Ghost Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Ghost Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for tertiary actions with minimal visual weight</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="inline-flex items-center rounded-md bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-6 py-3 text-base font-medium transition-colors">
                        Large Button
                      </button>
                      <button className="inline-flex items-center rounded-md bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-4 py-2 text-sm font-medium transition-colors">
                        Medium Button
                      </button>
                      <button className="inline-flex items-center rounded-md bg-transparent hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors">
                        Small Button
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-transparent hover:bg-black/5 dark:hover:bg-white/10
                    </code>
                  </div>
                </div>
              </div>

              {/* Destructive Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Destructive Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for destructive actions like delete</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="inline-flex items-center rounded-md bg-red-600 text-white px-6 py-3 text-base font-medium hover:bg-red-700 transition-colors">
                        Delete Item
                      </button>
                      <button className="inline-flex items-center rounded-md bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors">
                        Delete Item
                      </button>
                      <button className="inline-flex items-center rounded-md border border-red-600 text-red-600 bg-transparent hover:bg-red-50 dark:hover:bg-red-950 px-4 py-2 text-sm font-medium transition-colors">
                        Delete Outline
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      bg-red-600 text-white hover:bg-red-700
                    </code>
                  </div>
                </div>
              </div>

              {/* Link Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Link Buttons
                </h2>
                <p className="text-sm opacity-70 mb-4">Text-only buttons for inline actions</p>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="text-base underline hover:opacity-80 transition-opacity">
                        Link Button
                      </button>
                      <button className="text-sm underline hover:opacity-80 transition-opacity">
                        Link Button
                      </button>
                      <button className="text-xs underline hover:opacity-80 transition-opacity">
                        Link Button
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      underline hover:opacity-80
                    </code>
                  </div>
                </div>
              </div>

              {/* Button States */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Button States
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.02]">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90">
                        Normal
                      </button>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed">
                        Disabled
                      </button>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white dark:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </button>
                    </div>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded block">
                      Disabled: opacity-50 cursor-not-allowed
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Colors Section */}
        {selectedTab === "colors" && (
          <section>
            <div className="space-y-12">
              {/* Brand Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Brand Colors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-black dark:bg-white rounded mb-3"></div>
                    <p className="font-medium mb-1">Black / White</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-black dark:bg-white</code>
                    <p className="text-sm opacity-70 mt-2">Primary brand color - inverts in dark mode</p>
                  </div>
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-white dark:bg-black rounded mb-3 border border-black/10 dark:border-white/15"></div>
                    <p className="font-medium mb-1">White / Black</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-white dark:bg-black</code>
                    <p className="text-sm opacity-70 mt-2">Background color - inverts in dark mode</p>
                  </div>
                </div>
              </div>

              {/* Semantic Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Semantic Colors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-red-600 rounded mb-3"></div>
                    <p className="font-medium mb-1">Error / Destructive</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-red-600</code>
                    <p className="text-sm opacity-70 mt-2">Used for errors and destructive actions</p>
                  </div>
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-green-600 rounded mb-3"></div>
                    <p className="font-medium mb-1">Success</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-green-600</code>
                    <p className="text-sm opacity-70 mt-2">Used for success states</p>
                  </div>
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-yellow-600 rounded mb-3"></div>
                    <p className="font-medium mb-1">Warning</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-yellow-600</code>
                    <p className="text-sm opacity-70 mt-2">Used for warnings</p>
                  </div>
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <div className="w-full h-24 bg-blue-600 rounded mb-3"></div>
                    <p className="font-medium mb-1">Info</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">bg-blue-600</code>
                    <p className="text-sm opacity-70 mt-2">Used for informational states</p>
                  </div>
                </div>
              </div>

              {/* Opacity Scale */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Opacity Scale
                </h2>
                <p className="text-sm opacity-70 mb-4">Used for creating visual hierarchy and subtle backgrounds</p>
                <div className="space-y-3">
                  {[
                    { value: "100", opacity: "opacity-100", percent: "100%" },
                    { value: "90", opacity: "opacity-90", percent: "90%" },
                    { value: "80", opacity: "opacity-80", percent: "80%" },
                    { value: "70", opacity: "opacity-70", percent: "70%" },
                    { value: "60", opacity: "opacity-60", percent: "60%" },
                    { value: "50", opacity: "opacity-50", percent: "50%" },
                    { value: "40", opacity: "opacity-40", percent: "40%" },
                    { value: "30", opacity: "opacity-30", percent: "30%" },
                    { value: "20", opacity: "opacity-20", percent: "20%" },
                    { value: "10", opacity: "opacity-10", percent: "10%" },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center gap-4">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded w-24">
                        {item.opacity}
                      </code>
                      <span className="text-xs opacity-60 w-12">{item.percent}</span>
                      <div className="flex-1 h-12 bg-black dark:bg-white rounded border border-black/10 dark:border-white/15" style={{ opacity: parseInt(item.value) / 100 }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Background Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Background Colors
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/15">
                    <p className="font-medium mb-2">Subtle Background</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                      bg-black/[0.02] dark:bg-white/[0.02]
                    </code>
                    <p className="text-sm opacity-70 mt-2">Used for card backgrounds and subtle sections</p>
                  </div>
                  <div className="p-6 rounded-lg bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15">
                    <p className="font-medium mb-2">Medium Background</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                      bg-black/5 dark:bg-white/10
                    </code>
                    <p className="text-sm opacity-70 mt-2">Used for hover states and secondary backgrounds</p>
                  </div>
                </div>
              </div>

              {/* Border Colors */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Border Colors
                </h2>
                <div className="space-y-4">
                  <div className="p-6 rounded-lg border-2 border-black/10 dark:border-white/15">
                    <p className="font-medium mb-2">Default Border</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                      border-black/10 dark:border-white/15
                    </code>
                    <p className="text-sm opacity-70 mt-2">Used for most borders throughout the app</p>
                  </div>
                  <div className="p-6 rounded-lg border-2 border-black/20 dark:border-white/25">
                    <p className="font-medium mb-2">Emphasis Border</p>
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                      border-black/20 dark:border-white/25
                    </code>
                    <p className="text-sm opacity-70 mt-2">Used for borders that need more emphasis</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Forms Section */}
        {selectedTab === "forms" && (
          <section>
            <div className="space-y-12">
              {/* Text Inputs */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Text Inputs
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                    <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded mt-2 inline-block">
                      border border-black/10 focus:ring-2 focus:ring-black
                    </code>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Large Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-4 py-3 text-lg rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Small Input</label>
                    <input
                      type="text"
                      placeholder="Enter text..."
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Disabled Input</label>
                    <input
                      type="text"
                      placeholder="Disabled..."
                      disabled
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Error State</label>
                    <input
                      type="text"
                      placeholder="Error..."
                      className="w-full px-4 py-2 rounded-md border-2 border-red-500 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-sm text-red-600 mt-1">This field is required</p>
                  </div>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Textarea
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Textarea</label>
                    <textarea
                      placeholder="Enter multiple lines..."
                      rows={4}
                      className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-vertical"
                    />
                  </div>
                </div>
              </div>

              {/* Select Dropdown */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Select Dropdown
                </h2>
                <div className="space-y-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Select</label>
                    <select className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent">
                      <option>Option 1</option>
                      <option>Option 2</option>
                      <option>Option 3</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Checkboxes and Radio Buttons */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Checkboxes & Radio Buttons
                </h2>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <p className="text-sm font-medium mb-3">Checkboxes</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" />
                        <span>Checkbox option 1</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" defaultChecked />
                        <span>Checkbox option 2 (checked)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" disabled />
                        <span>Checkbox option 3 (disabled)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Radio Buttons</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="radio-example" className="w-4 h-4" />
                        <span>Radio option 1</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="radio-example" className="w-4 h-4" defaultChecked />
                        <span>Radio option 2 (checked)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                        <input type="radio" name="radio-example" className="w-4 h-4" disabled />
                        <span>Radio option 3 (disabled)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Layouts */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Form Layouts
                </h2>
                <div className="space-y-6 max-w-2xl">
                  <div className="p-6 rounded-lg border border-black/10 dark:border-white/15">
                    <h3 className="text-lg font-semibold mb-4">Example Form</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Message</label>
                        <textarea
                          placeholder="Your message..."
                          rows={3}
                          className="w-full px-4 py-2 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-vertical"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="w-4 h-4 rounded border-black/10 dark:border-white/15" />
                        <label className="text-sm">I agree to the terms and conditions</label>
                      </div>
                      <button className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90">
                        Submit Form
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Spacing Section */}
        {selectedTab === "spacing" && (
          <section>
            <div className="space-y-12">
              {/* Spacing Scale */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Spacing Scale
                </h2>
                <p className="text-sm opacity-70 mb-4">
                  Tailwind spacing scale based on 0.25rem (4px) increments
                </p>
                <div className="space-y-3">
                  {[
                    { size: "0", value: "0px", class: "0" },
                    { size: "1", value: "4px / 0.25rem", class: "1" },
                    { size: "2", value: "8px / 0.5rem", class: "2" },
                    { size: "3", value: "12px / 0.75rem", class: "3" },
                    { size: "4", value: "16px / 1rem", class: "4" },
                    { size: "5", value: "20px / 1.25rem", class: "5" },
                    { size: "6", value: "24px / 1.5rem", class: "6" },
                    { size: "8", value: "32px / 2rem", class: "8" },
                    { size: "10", value: "40px / 2.5rem", class: "10" },
                    { size: "12", value: "48px / 3rem", class: "12" },
                    { size: "16", value: "64px / 4rem", class: "16" },
                    { size: "20", value: "80px / 5rem", class: "20" },
                    { size: "24", value: "96px / 6rem", class: "24" },
                  ].map((item) => (
                    <div key={item.size} className="flex items-center gap-4">
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded w-20">
                        {item.size}
                      </code>
                      <span className="text-xs opacity-60 w-32">{item.value}</span>
                      <div className="h-8 bg-black dark:bg-white rounded" style={{ width: `${item.size === "0" ? 1 : item.size}px` }}></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Padding Examples */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Padding Examples
                </h2>
                <div className="space-y-4">
                  {[
                    { class: "p-2", label: "p-2 (8px all sides)" },
                    { class: "p-4", label: "p-4 (16px all sides)" },
                    { class: "p-6", label: "p-6 (24px all sides)" },
                    { class: "px-4 py-2", label: "px-4 py-2 (16px horizontal, 8px vertical)" },
                    { class: "px-6 py-3", label: "px-6 py-3 (24px horizontal, 12px vertical)" },
                  ].map((item) => (
                    <div key={item.class} className="border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`${item.class} bg-black/5 dark:bg-white/10`}>
                        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/15 rounded p-2 text-sm">
                          Content Area
                        </div>
                      </div>
                      <div className="px-4 py-2 border-t border-black/10 dark:border-white/15">
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                          {item.class}
                        </code>
                        <span className="text-xs opacity-60 ml-2">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gap Examples */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Gap Examples (Flexbox/Grid)
                </h2>
                <div className="space-y-4">
                  {[
                    { class: "gap-2", label: "gap-2 (8px)", count: 3 },
                    { class: "gap-4", label: "gap-4 (16px)", count: 3 },
                    { class: "gap-6", label: "gap-6 (24px)", count: 3 },
                    { class: "gap-8", label: "gap-8 (32px)", count: 3 },
                  ].map((item) => (
                    <div key={item.class} className="p-4 border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`flex ${item.class}`}>
                        {Array.from({ length: item.count }).map((_, i) => (
                          <div key={i} className="flex-1 h-16 bg-black/10 dark:bg-white/10 rounded"></div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">
                          {item.class}
                        </code>
                        <span className="text-xs opacity-60 ml-2">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-black/10 dark:border-white/15">
                  Border Radius
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { class: "rounded-none", label: "None", value: "0px" },
                    { class: "rounded-sm", label: "Small", value: "2px" },
                    { class: "rounded", label: "Default", value: "4px" },
                    { class: "rounded-md", label: "Medium", value: "6px" },
                    { class: "rounded-lg", label: "Large", value: "8px" },
                    { class: "rounded-xl", label: "XL", value: "12px" },
                    { class: "rounded-2xl", label: "2XL", value: "16px" },
                    { class: "rounded-3xl", label: "3XL", value: "24px" },
                    { class: "rounded-full", label: "Full", value: "9999px" },
                  ].map((item) => (
                    <div key={item.class} className="p-4 border border-black/10 dark:border-white/15 rounded-lg">
                      <div className={`w-full h-20 bg-black dark:bg-white ${item.class} mb-3`}></div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <code className="text-xs bg-black/5 dark:bg-white/10 px-2 py-1 rounded">{item.class}</code>
                      <p className="text-xs opacity-60 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

