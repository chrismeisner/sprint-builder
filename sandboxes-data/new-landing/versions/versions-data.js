// Version Registry
// Manually update this file when creating new versions
// Or use the versions-data.json for a more dynamic approach

var VERSIONS = [
  {
    name: "v4-playbook-direction-2026-03-12",
    version: "4",
    title: "Playbook Direction",
    date: "March 12, 2026",
    dateValue: "2026-03-12",
    lastModified: "2026-03-12T12:00:00Z",
    description: "Copy exploration that adds a subtle 'Let's move the ball' header CTA and reframes the services section around 'My Playbook.'",
    features: [
      "Subtle 'Let's move the ball' link in the top header",
      "'My Playbook' framing for the services section",
      "Momentum-oriented intro copy without changing the page structure"
    ],
    status: "archived",
    path: "v4-playbook-direction-2026-03-12/index.html"
  },
  {
    name: "v3-mvp-2026-03-02",
    version: "3",
    title: "MVP",
    date: "March 2, 2026",
    dateValue: "2026-03-02",
    lastModified: "2026-03-02T12:00:00Z",
    description: "Streamlined MVP based on v2. Hides samples carousel, projects table, and availability calendar. Book-a-call links updated to the real Cal.com sprint planning page.",
    features: [
      "Cal.com sprint planning link on hero CTA and sticky header",
      "Samples carousel hidden (commented out for later)",
      "Availability section hidden (commented out for later)",
      "Projects section hidden (commented out for later)"
    ],
    status: "current",
    path: "v3-mvp-2026-03-02/index.html"
  },
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
    status: "archived",
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
