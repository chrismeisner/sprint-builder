// Version Registry
// Manually update this file when creating new versions
// Or use the versions-data.json for a more dynamic approach

const VERSIONS = [
  {
    name: "v1-baseline-2026-02-11",
    version: "1",
    title: "Baseline",
    date: "February 11, 2026",
    dateValue: "2026-02-11",
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
  // Add new versions here
  // Example:
  // {
  //   name: "v2-services-redesign-2026-02-15",
  //   version: "2",
  //   title: "Services Redesign",
  //   date: "February 15, 2026",
  //   dateValue: "2026-02-15",
  //   description: "Updated services section with new pricing and offerings.",
  //   features: [
  //     "Redesigned services cards",
  //     "Updated pricing structure",
  //     "New testimonials section"
  //   ],
  //   status: "archived",
  //   path: "v2-services-redesign-2026-02-15/index.html"
  // }
];

// Sort versions by date (newest first)
VERSIONS.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue));
