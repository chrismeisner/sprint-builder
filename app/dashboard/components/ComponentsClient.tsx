"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PackageCard, { type SprintPackage } from "@/app/components/PackageCard";
import HeroSection from "@/app/components/HeroSection";
import SectionHeader from "@/app/components/SectionHeader";
import HowItWorksSteps from "@/app/components/HowItWorksSteps";
import { resolveComponentGridPreset } from "@/app/components/componentGrid";
import { typographyScale } from "@/lib/design-system/tokens";
import { getTypographyClassName, type TypographyScaleId } from "@/lib/design-system/typography-classnames";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";

type ComponentsClientProps = {
  samplePackages: SprintPackage[];
};

const fallbackPackages: SprintPackage[] = [
  {
    id: "fallback-foundation",
    name: "Sample Foundation Sprint",
    slug: "sample-foundation",
    description: "Full PackageCard preview using the detailed variant and emoji list.",
    category: "Branding",
    package_type: "foundation",
    tagline: "Demonstration only",
    featured: false,
    deliverables: [
      {
        deliverableId: "sample-del-1",
        name: "Foundation Workshop",
        description: "3-hour alignment session",
        scope: "Live workshop, findings deck, sprint plan",
        fixedHours: 12,
        fixedPrice: 3000,
        quantity: 1,
        complexityScore: 1,
      },
      {
        deliverableId: "sample-del-2",
        name: "Brand Style Guide",
        description: "Systemized typography + colors",
        scope: "PDF, Figma source file, Loom walkthrough",
        fixedHours: 30,
        fixedPrice: 9000,
        quantity: 1,
        complexityScore: 1.2,
      },
    ],
  },
  {
    id: "fallback-extend",
    name: "Sample Expansion Sprint",
    slug: "sample-expansion",
    description: "Shows the default variant stacked below the detailed card.",
    category: "Product Extend",
    package_type: "extend",
    tagline: "One more stackable sprint",
    featured: true,
    deliverables: [
      {
        deliverableId: "sample-del-3",
        name: "Landing Page",
        description: "High-converting launch page",
        scope: "Wireframe, visual design, build-ready file",
        fixedHours: 24,
        fixedPrice: 7500,
        quantity: 1,
        complexityScore: 1.1,
      },
      {
        deliverableId: "sample-del-4",
        name: "Social Kit",
        description: "Launch graphics bundle",
        scope: "5x statics, 3x story variations",
        fixedHours: 10,
        fixedPrice: 2500,
        quantity: 1,
        complexityScore: 1,
      },
    ],
  },
];

const DEFAULT_COMPONENT_ORDER = ["sectionHeader", "howItWorks", "hero", "image", "packageCard"] as const;
type ComponentKey = (typeof DEFAULT_COMPONENT_ORDER)[number];

const componentLabelMap: Record<ComponentKey, string> = {
  sectionHeader: "SectionHeader",
  howItWorks: "HowItWorksSteps",
  hero: "HeroSection",
  image: "Image spotlight",
  packageCard: "PackageCard",
};

type StorageTestFileResponse = {
  name: string;
  url: string;
  signedUrl?: string;
  contentType?: string;
  metadata?: Record<string, string>;
  created?: string;
  updated?: string;
};

type StorageImageOption = {
  id: string;
  label: string;
  url: string;
  path: string;
  sourceLabel?: string;
  uploadedAt?: string;
};

const ADMIN_UPLOAD_PREFIX = "admin-uploads/";
const STORAGE_TEST_ROUTE = "/dashboard/storage-test";

const parseTimestampValue = (value?: string) => {
  if (!value) {
    return 0;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function ComponentsClient({ samplePackages }: ComponentsClientProps) {
  const packages = samplePackages.length > 0 ? samplePackages : fallbackPackages;
  const previewCountOptions = [1, 2, 3];
  const previewOptions = useMemo(
    () =>
      packages.map((pkg, index) => ({
        id: `${pkg.id}-${index}`,
        label: `PackageCard · ${index === 0 ? "detailed" : "default"} variant`,
        pkg,
        variant: (index === 0 ? "detailed" : "default") as "detailed" | "default",
        showEmojis: index === 0,
      })),
    [packages],
  );
  const [selectedOptionId, setSelectedOptionId] = useState(() => previewOptions[0]?.id ?? "");
  const [previewCount, setPreviewCount] = useState<number>(1);
  const [heroWidth, setHeroWidth] = useState<number | null>(null);
  const [packageWidth, setPackageWidth] = useState<number | null>(null);
  const [sectionHeaderWidth, setSectionHeaderWidth] = useState<number | null>(null);
  const [howItWorksWidth, setHowItWorksWidth] = useState<number | null>(null);
  const [imageWidth, setImageWidth] = useState<number | null>(null);
  const [imageOptions, setImageOptions] = useState<StorageImageOption[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showContainerStroke, setShowContainerStroke] = useState(true);
  const [showSectionDetails, setShowSectionDetails] = useState(true);
  const [showTypographyLabels, setShowTypographyLabels] = useState(false);
  const [componentOrder, setComponentOrder] = useState<ComponentKey[]>(() => [...DEFAULT_COMPONENT_ORDER]);
  const [pendingOrder, setPendingOrder] = useState<ComponentKey[]>(() => [...DEFAULT_COMPONENT_ORDER]);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const typographySignatures = useMemo(
    () =>
      typographyScale.map((token) => ({
        id: token.id as TypographyScaleId,
        classTokens: getTypographyClassName(token.id as TypographyScaleId)
          .split(/\s+/)
          .filter(Boolean),
      })),
    [],
  );
  const fetchStorageImages = useCallback(async () => {
    setImageLoading(true);
    setImageError(null);
    try {
      const params = new URLSearchParams({
        action: "list",
        includeSignedUrls: "true",
        prefix: ADMIN_UPLOAD_PREFIX,
      });
      const response = await fetch(`/api/admin/storage-test?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const data = await response.json();
      if (!data.success || !Array.isArray(data.files)) {
        throw new Error(data.error || "Unexpected response payload");
      }
      const mapped = (data.files as StorageTestFileResponse[])
        .filter((file) => file.contentType?.startsWith("image/"))
        .map<StorageImageOption>((file) => ({
          id: file.name,
          label: file.metadata?.originalName || file.name.split("/").pop() || file.name,
          url: file.signedUrl || file.url,
          path: file.name,
          sourceLabel: file.metadata?.uploadSourceLabel || file.metadata?.uploadSource || undefined,
          uploadedAt: file.updated || file.created || undefined,
        }))
        .sort((a, b) => parseTimestampValue(b.uploadedAt) - parseTimestampValue(a.uploadedAt));

      setImageOptions(mapped);
      setSelectedImageId((previous) => {
        if (previous && mapped.some((image) => image.id === previous)) {
          return previous;
        }
        return mapped[0]?.id ?? "";
      });
    } catch (error) {
      console.error("[Components] Failed to load storage images", error);
      setImageOptions([]);
      setSelectedImageId("");
      setImageError(error instanceof Error ? error.message : "Failed to load storage images");
    } finally {
      setImageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (previewOptions.length === 0) {
      return;
    }
    const active = previewOptions.find((option) => option.id === selectedOptionId);
    if (!active) {
      setSelectedOptionId(previewOptions[0].id);
    }
  }, [previewOptions, selectedOptionId]);
  useEffect(() => {
    setPackageWidth(null);
  }, [selectedOptionId, previewCount]);
  useEffect(() => {
    fetchStorageImages();
  }, [fetchStorageImages]);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    const container = rootRef.current;

    const cleanupAutoLabels = () => {
      const autoNodes = container.querySelectorAll<HTMLElement>("[data-typography-auto='true']");
      autoNodes.forEach((element) => {
        element.removeAttribute("data-typography-id");
        element.removeAttribute("data-typography-auto");
      });
    };

    if (!showTypographyLabels) {
      cleanupAutoLabels();
      return;
    }

    if (typeof MutationObserver === "undefined") {
      return;
    }

    const annotateNode = (element: HTMLElement) => {
      const hasManualAttribute = element.dataset.typographyAuto !== "true" && element.hasAttribute("data-typography-id");
      if (hasManualAttribute) {
        return;
      }

      const classList = element.classList;
      if (!classList || classList.length === 0) {
        if (element.dataset.typographyAuto === "true") {
          element.removeAttribute("data-typography-id");
          element.removeAttribute("data-typography-auto");
        }
        return;
      }

      let matchedId: TypographyScaleId | null = null;
      for (const signature of typographySignatures) {
        if (signature.classTokens.every((token) => classList.contains(token))) {
          matchedId = signature.id;
          break;
        }
      }

      if (matchedId) {
        element.dataset.typographyId = matchedId;
        element.dataset.typographyAuto = "true";
      } else if (element.dataset.typographyAuto === "true") {
        element.removeAttribute("data-typography-id");
        element.removeAttribute("data-typography-auto");
      }
    };

    const annotateAllNodes = () => {
      const nodes = container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, span, div, a, li, code, label");
      nodes.forEach(annotateNode);
    };

    annotateAllNodes();

    const observer = new MutationObserver(() => {
      annotateAllNodes();
    });

    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      cleanupAutoLabels();
    };
  }, [showTypographyLabels, typographySignatures]);

  const activeOption = previewOptions.find((option) => option.id === selectedOptionId) ?? previewOptions[0];
  const currentLayout = resolveComponentGridPreset(previewCount);
  const formatWidth = (width: number | null) => (width ? `${width}px · ${(width / 16).toFixed(1)}rem` : "Measuring…");
  const heroWidthDisplay = formatWidth(heroWidth);
  const packageWidthDisplay = formatWidth(packageWidth);
  const sectionHeaderWidthDisplay = formatWidth(sectionHeaderWidth);
  const howItWorksWidthDisplay = formatWidth(howItWorksWidth);
  const imageWidthDisplay = formatWidth(imageWidth);
  const selectedImage = imageOptions.find((image) => image.id === selectedImageId);
  const heroPreviewProps = {
    title: "Let's climb",
    supportingText: "Fast clarity. Fast momentum. Real output every 10 days.",
    primaryCta: { label: "View Foundation Packages", href: "/#foundation-packages" },
    secondaryCta: { label: "How it works", href: "/how-it-works" },
  };
  const sectionHeaderPreview = {
    label: "Services",
    heading: "Two weeks. One clear outcome.",
    description:
      "This sentence is about how our services are tailored for early stage startups and founders and give them speed, predictable pricing and guaranteed deliverables.",
  };
  const howItWorksStepsPreview = [
    {
      title: "Discovery",
      description:
        "We align on goals, gather context, and surface possibilities. This sets the stage for sharp decisions and sets the sprint up for success.",
      icon: "🔺",
    },
    {
      title: "Direction",
      description:
        "Together, we identify the strongest direction. Scope is locked, expectations are clear, and the studio shifts into build mode.",
      icon: "📐",
    },
    {
      title: "Delivery",
      description:
        "We go heads-down. You get high-quality, on-time deliverables — shaped, refined, and ready to ship by Friday of week two.",
      icon: "✨",
    },
  ];

  const measuredPanelClassName = `${showContainerStroke ? "border border-black/10 dark:border-white/15 " : ""}bg-transparent`;
  const isDefaultOrder = componentOrder.every((key, index) => key === DEFAULT_COMPONENT_ORDER[index]);
  const handleOpenReorder = () => {
    setPendingOrder([...componentOrder]);
    setIsReorderModalOpen(true);
  };
  const handleCloseReorder = () => setIsReorderModalOpen(false);
  const handleSaveReorder = () => {
    setComponentOrder([...pendingOrder]);
    setIsReorderModalOpen(false);
  };
  const handleResetOrder = () => {
    const nextOrder = [...DEFAULT_COMPONENT_ORDER];
    setComponentOrder(nextOrder);
    setPendingOrder(nextOrder);
  };
  const handleResetPendingOrder = () => {
    setPendingOrder([...DEFAULT_COMPONENT_ORDER]);
  };
  const movePendingItem = (index: number, direction: -1 | 1) => {
    setPendingOrder((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const packageControls = (
    <div className="flex flex-wrap items-center gap-3">
      {previewOptions.length > 1 && (
        <Select
          aria-label="View variant"
          label="Variant"
          value={selectedOptionId}
          onChange={(event) => setSelectedOptionId(event.target.value)}
          className="min-w-[12rem] text-xs"
        >
          {previewOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      )}

      <Select
        aria-label="Preview count"
        label="Count"
        value={previewCount}
        onChange={(event) => setPreviewCount(Number(event.target.value))}
        className="min-w-[10rem] text-xs"
      >
        {previewCountOptions.map((count) => (
          <option key={count} value={count}>
            {count} component{count > 1 ? "s" : ""}
          </option>
        ))}
      </Select>
    </div>
  );

  const imageControls = (
    <div className="flex flex-wrap items-center gap-3">
      {imageOptions.length > 0 ? (
        <Select
          aria-label="Select stored image"
          label="Image"
          value={selectedImageId}
          disabled={imageLoading}
          onChange={(event) => setSelectedImageId(event.target.value)}
          className="min-w-[14rem] text-xs"
        >
          {imageOptions.map((image) => (
            <option key={image.id} value={image.id}>
              {image.label}
            </option>
          ))}
        </Select>
      ) : (
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          {imageLoading ? "Looking for uploads…" : "No stored images"}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="normal-case tracking-normal"
        onClick={fetchStorageImages}
        disabled={imageLoading}
      >
        {imageLoading ? "Refreshing…" : "Reload images"}
      </Button>
    </div>
  );

  const sectionsByKey: Record<ComponentKey, () => JSX.Element> = {
    sectionHeader: () => (
      <ComponentSection
        key="sectionHeader"
        title={componentLabelMap.sectionHeader}
        widthLabel={sectionHeaderWidthDisplay}
        showDetails={showSectionDetails}
      >
        <MeasuredPanel className={measuredPanelClassName} onWidthChange={setSectionHeaderWidth}>
          <SectionHeader {...sectionHeaderPreview} />
        </MeasuredPanel>
      </ComponentSection>
    ),
    howItWorks: () => (
      <ComponentSection
        key="howItWorks"
        title={componentLabelMap.howItWorks}
        widthLabel={howItWorksWidthDisplay}
        showDetails={showSectionDetails}
      >
        <MeasuredPanel className={measuredPanelClassName} onWidthChange={setHowItWorksWidth}>
          <HowItWorksSteps steps={howItWorksStepsPreview} />
        </MeasuredPanel>
      </ComponentSection>
    ),
    hero: () => (
      <ComponentSection
        key="hero"
        title={componentLabelMap.hero}
        widthLabel={heroWidthDisplay}
        showDetails={showSectionDetails}
      >
        <MeasuredPanel className={measuredPanelClassName} onWidthChange={setHeroWidth}>
          <HeroSection
            {...heroPreviewProps}
            minHeight={false}
            className="bg-transparent"
          />
        </MeasuredPanel>
      </ComponentSection>
    ),
    image: () => (
      <ComponentSection
        key="image"
        title={componentLabelMap.image}
        widthLabel={imageWidthDisplay}
        controls={imageControls}
        showDetails={showSectionDetails}
      >
        <MeasuredPanel className={measuredPanelClassName} onWidthChange={setImageWidth}>
          <ComponentContainer>
            <div className="space-y-4">
              <div className="relative overflow-hidden border border-black/10 bg-black/5 text-white shadow-sm dark:border-white/15 dark:bg-white/5">
                {selectedImage ? (
                  <>
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.label}
                      loading="lazy"
                      decoding="async"
                      className="h-[420px] w-full object-cover"
                    />
                  </>
                ) : (
                  <div className="flex h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-sm font-semibold text-black/60 dark:text-white/70 lg:h-[420px]">
                    {imageLoading ? (
                      <span>Searching for stored images…</span>
                    ) : (
                      <>
                        <span>No stored hero image yet.</span>
                        <a
                          href={STORAGE_TEST_ROUTE}
                          className="text-xs font-semibold text-black underline decoration-dotted dark:text-white"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open storage test to upload one →
                        </a>
                      </>
                    )}
                  </div>
                )}
              </div>
              {imageError && (
                <div className="rounded-2xl border border-red-200/60 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800 dark:border-red-500/40 dark:bg-red-950/20 dark:text-red-200">
                  Unable to load storage assets ({imageError}).{" "}
                  <a
                    href={STORAGE_TEST_ROUTE}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-dotted"
                  >
                    Open storage test
                  </a>
                </div>
              )}
            </div>
          </ComponentContainer>
        </MeasuredPanel>
      </ComponentSection>
    ),
    packageCard: () => (
      <ComponentSection
        key="packageCard"
        title={componentLabelMap.packageCard}
        widthLabel={packageWidthDisplay}
        controls={packageControls}
        showDetails={showSectionDetails}
      >
        <MeasuredPanel className={measuredPanelClassName} onWidthChange={setPackageWidth}>
          {activeOption && (
            <div className="space-y-6">
              {previewCount === 1 ? (
                <ComponentContainer constrainWidth>
                  <div className={currentLayout.className} data-component-grid={currentLayout.id}>
                    <PackageCard
                      pkg={activeOption.pkg}
                      variant={activeOption.variant}
                      showEmojis={activeOption.showEmojis}
                    />
                  </div>
                </ComponentContainer>
              ) : (
                <ComponentContainer constrainWidth={false}>
                  <div className={currentLayout.className} data-component-grid={currentLayout.id}>
                    {Array.from({ length: previewCount }).map((_, index) => (
                      <PackageCard
                        key={`${activeOption.id}-${index}`}
                        pkg={activeOption.pkg}
                        variant={activeOption.variant}
                        showEmojis={activeOption.showEmojis}
                      />
                    ))}
                  </div>
                </ComponentContainer>
              )}
            </div>
          )}
        </MeasuredPanel>
      </ComponentSection>
    ),
  };

  return (
    <div
      ref={rootRef}
      className={`container max-w-6xl py-10 space-y-16 ${showTypographyLabels ? "typography-label-mode" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleOpenReorder} className="normal-case tracking-normal">
            Edit order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetOrder}
            disabled={isDefaultOrder}
            className="normal-case tracking-normal"
          >
            Reset order
          </Button>
        </div>
        <div className="inline-flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-black/70 dark:text-white/70">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-black/20 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/40 dark:bg-black dark:text-white"
              checked={showContainerStroke}
              onChange={(event) => setShowContainerStroke(event.target.checked)}
            />
            Show container stroke
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-black/20 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/40 dark:bg-black dark:text-white"
              checked={showSectionDetails}
              onChange={(event) => setShowSectionDetails(event.target.checked)}
            />
            Show section details
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-black/20 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/40 dark:bg-black dark:text-white"
              checked={showTypographyLabels}
              onChange={(event) => setShowTypographyLabels(event.target.checked)}
            />
            Show font class
          </label>
        </div>
      </div>

      {componentOrder.map((key) => {
        const renderSection = sectionsByKey[key];
        return renderSection ? renderSection() : null;
      })}

      {isReorderModalOpen && (
        <ReorderModal
          order={pendingOrder}
          labels={componentLabelMap}
          onClose={handleCloseReorder}
          onMove={movePendingItem}
          onSave={handleSaveReorder}
          onReset={handleResetPendingOrder}
        />
      )}
    </div>
  );
}

type ComponentContainerProps = {
  children: ReactNode;
  constrainWidth?: boolean;
};

function ComponentContainer({ children, constrainWidth = true }: ComponentContainerProps) {
  return (
    <div className={`w-full ${constrainWidth ? "mx-auto max-w-3xl" : ""}`}>
      {children}
    </div>
  );
}

type ComponentSectionProps = {
  title: string;
  widthLabel: string;
  controls?: ReactNode;
  children: ReactNode;
  showDetails?: boolean;
};

function ComponentSection({ title, widthLabel, controls, children, showDetails = true }: ComponentSectionProps) {
  return (
    <section className="space-y-4">
      {showDetails && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="subtle">{title}</Badge>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {controls && <div className="flex flex-wrap items-center gap-3">{controls}</div>}
            <Badge variant="metric">{widthLabel}</Badge>
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

type MeasuredPanelProps = {
  children: ReactNode;
  className?: string;
  onWidthChange?: (width: number | null) => void;
};

function MeasuredPanel({ children, className, onWidthChange }: MeasuredPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !panelRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        onWidthChange?.(Math.round(entry.contentRect.width));
      }
    });

    observer.observe(panelRef.current);

    return () => {
      observer.disconnect();
      onWidthChange?.(null);
    };
  }, [onWidthChange]);

  return (
    <div ref={panelRef} className={className}>
      {children}
    </div>
  );
}

type ReorderModalProps = {
  order: ComponentKey[];
  labels: Record<ComponentKey, string>;
  onClose: () => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onSave: () => void;
  onReset: () => void;
};

function ReorderModal({ order, labels, onClose, onMove, onSave, onReset }: ReorderModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/20 dark:bg-black">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-black dark:text-white">Edit component order</h3>
          <p className="text-sm text-black/60 dark:text-white/60">Use the controls to reorder previews.</p>
        </div>
        <ul className="mt-6 space-y-3">
          {order.map((key, index) => (
            <li
              key={key}
              className="flex items-center justify-between rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm font-semibold text-black dark:border-white/20 dark:bg-white/5 dark:text-white"
            >
              <span>{labels[key]}</span>
              <div className="inline-flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="normal-case tracking-normal"
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                >
                  Move up
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="normal-case tracking-normal"
                  onClick={() => onMove(index, 1)}
                  disabled={index === order.length - 1}
                >
                  Move down
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="normal-case tracking-normal" onClick={onReset}>
            Reset to default
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="normal-case tracking-normal" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" className="normal-case tracking-normal" onClick={onSave}>
              Save order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

