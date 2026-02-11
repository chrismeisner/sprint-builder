// Version Registry
// Manually update this file when creating new versions
// Or use the versions-data.json for a more dynamic approach

const VERSIONS = [
  {
    name: "v2-samples-carousel-2026-02-11",
    version: "2",
    title: "Samples Carousel",
    date: "February 11, 2026",
    dateValue: "2026-02-11",
    lastModified: "2026-02-11T12:00:00Z",
    description: "Replaced multiple Projects cards with a single Samples image carousel. Each slide has a consistent label with project name and short description.",
    features: [
      "Single image carousel replacing project cards",
      "Consistent per-slide labels (name + description)",
      "Previous/Next navigation with dot indicators",
      "Keyboard arrow-key support"
    ],
    status: "current",
    path: "v2-samples-carousel-2026-02-11/index.html"
  },
  {
    name: "v1-baseline-2026-02-11",
    version: "1",
    title: "Baseline",
    date: "February 11, 2026",
    dateValue: "2026-02-11",
    lastModified: "2026-02-11T08:00:00Z",
    description: "Initial baseline version - clean, minimalist portfolio landing page with dark mode support.",
    features: [
      "Single-page layout with sidebar navigation",
      "Dark mode support (system preference)",
      "Service offerings: Brand Sprint, Product Sprint, Fractional",
      "Project slideshow functionality"
    ],
    status: "baseline",
    path: "v1-baseline-2026-02-11/index.html"
  }
];

// Sort versions by lastModified (newest first), falling back to dateValue
VERSIONS.sort((a, b) => {
  const aTime = a.lastModified ? new Date(a.lastModified) : new Date(a.dateValue);
  const bTime = b.lastModified ? new Date(b.lastModified) : new Date(b.dateValue);
  return bTime - aTime;
});
