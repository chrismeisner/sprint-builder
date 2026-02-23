"use client";

import Image from "next/image";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import PackageCard, { type SprintPackage } from "@/app/components/PackageCard";
import HeroSection, { type HeroSectionProps } from "@/app/components/HeroSection";
import SectionHeader from "@/app/components/SectionHeader";
import SectionIntro from "@/app/components/SectionIntro";
import HowItWorksSteps from "@/app/components/HowItWorksSteps";
import GettingStartedStep, { getGettingStartedStackClassName } from "@/app/components/GettingStartedStep";
import AboutFounder from "@/app/components/AboutFounder";
import Footer from "@/app/components/Footer";
import { resolveComponentGridPreset } from "@/app/components/componentGrid";
import { typography } from "@/app/components/typography";
import { typographyScale } from "@/lib/design-system/tokens";
import { getTypographyClassName, type TypographyScaleId } from "@/lib/design-system/typography-classnames";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import FAQSection from "@/components/ui/FAQSection";
import WidthRuler from "@/components/WidthRuler";

type ComponentsClientProps = {
  samplePackages: SprintPackage[];
};

const fallbackPackages: SprintPackage[] = [
  {
    id: "fallback-foundation",
    name: "Sample Foundation Sprint",
    slug: "sample-foundation",
    description: "Full PackageCard preview using the detailed variant and emoji list.",
    package_type: "foundation",
    tagline: "Demonstration only",
    featured: false,
    deliverables: [
      {
        deliverableId: "sample-del-1",
        name: "Wordmark Logo",
        description: "Primary logo lockup with variations",
        scope: "SVG, PNG, Figma source, usage guidelines",
        fixedHours: 16,
        fixedPrice: 4000,
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
    name: "Sample Sprint",
    slug: "sample-sprint",
    description: "Shows the default variant stacked below the detailed card.",
    package_type: "foundation",
    tagline: "A custom-scoped sprint",
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

const DEFAULT_COMPONENT_ORDER = [
  "sectionIntro",
  "sectionHeader",
  "howItWorks",
  "faq",
  "hero",
  "image",
  "gettingStarted",
  "packageCard",
  "aboutFounder",
  "footer",
] as const;
type ComponentKey = (typeof DEFAULT_COMPONENT_ORDER)[number];

const componentLabelMap: Record<ComponentKey, string> = {
  sectionIntro: "SectionIntro",
  sectionHeader: "SectionHeader",
  howItWorks: "HowItWorksSteps",
  faq: "FAQSection",
  hero: "HeroSection",
  image: "Image spotlight",
  gettingStarted: "GettingStartedStep",
  packageCard: "PackageCard",
  aboutFounder: "AboutFounder",
  footer: "Footer",
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
  const [previewCount, setPreviewCount] = useState<number>(3);
  const [imageOptions, setImageOptions] = useState<StorageImageOption[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showContainerStroke, setShowContainerStroke] = useState(true);
  const [showSectionDetails, setShowSectionDetails] = useState(true);
  const [showTypographyLabels, setShowTypographyLabels] = useState(false);
  const [componentOrder, setComponentOrder] = useState<ComponentKey[]>(() => [...DEFAULT_COMPONENT_ORDER]);
  const [pendingOrder, setPendingOrder] = useState<ComponentKey[]>(() => [...DEFAULT_COMPONENT_ORDER]);
  const [gettingStartedCount, setGettingStartedCount] = useState(4);
  const [gettingStartedVariant, setGettingStartedVariant] = useState<"card" | "flat">("card");

  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sectionIntroPanelRef = useRef<HTMLDivElement>(null);
  const sectionHeaderPanelRef = useRef<HTMLDivElement>(null);
  const howItWorksPanelRef = useRef<HTMLDivElement>(null);
  const faqPanelRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const imagePanelRef = useRef<HTMLDivElement>(null);
  const packagePanelRef = useRef<HTMLDivElement>(null);
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
  const selectedImage = imageOptions.find((image) => image.id === selectedImageId);
  const heroPreviewProps: HeroSectionProps = {
    eyebrow: "Now booking for January 2026",
    title: "Early brand & product support for fast-moving founders",
    subtitle: "Two-week sprints led by a senior creative director—strategy, design, and messaging aligned in one climb.",
    body: (
      <>
        <span className="block">
          Turn your next push into a focused sprint with a dedicated partner who knows how to ship quality work without wasted cycles.
        </span>
        <span className="block mt-4">
          Start with a Brand or Product Foundation Sprint to lock direction, codify your story, and ship premium deliverables your team can run with.
        </span>
        <span className="block mt-4">
          After that, book additional sprints from the deliverable library or add Monthly Support (from $4,000/month) for biweekly check-ins and ongoing deliverable updates.
        </span>
      </>
    ),
    primaryCta: { label: "Get started", href: "https://form.typeform.com/to/eEiCy7Xj" },
    secondaryCta: { label: "Book a discovery call", href: "https://cal.com/chrismeisner/intro" },
    ctaTarget: "_blank",
    ctaRel: "noreferrer noopener",
  };
  const sectionIntroPreview = {
    text: "Snapshot",
    align: "center" as const,
  };
  const sectionHeaderPreview = {
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

  const faqPreview = {
    items: [
      {
        question: "How long is a sprint?",
        answer: "Ten working days. Monday kickoff, Friday handoff with Loom walkthroughs and source files.",
      },
      {
        question: "What do you need to get started?",
        answer: "Your intake form, access to any core files, and a 60–90 minute live kickoff.",
      },
      {
        question: "Can we stack multiple sprints?",
        answer: "Yes. Each sprint is built from the deliverable library so you can run back-to-back sprints with different scopes—brand, product, launch, or mixed.",
      },
    ],
  };

  const previewSurfaceClassName = `${showContainerStroke ? "border border-black/10 dark:border-white/15 " : ""}bg-transparent`;
  const widthRulerClassName = "text-black/60 dark:text-white/60";
  const controlLabelClasses = `${typography.bodySm} inline-flex items-center gap-2 normal-case tracking-normal`;
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

  const selectLabelClasses = `${typography.bodySm} text-black/70 dark:text-white/75`;
  const selectFieldClasses =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-black dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white";
  const gettingStartedLayoutClass = getGettingStartedStackClassName(gettingStartedCount, "grid gap-4");

  const packageControls = (
    <div className="grid gap-3 sm:grid-cols-2">
      {previewOptions.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className={selectLabelClasses}>Variant</span>
          <Select
            aria-label="View variant"
            value={selectedOptionId}
            onChange={(event) => setSelectedOptionId(event.target.value)}
            className={selectFieldClasses}
          >
            {previewOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className={selectLabelClasses}>Count</span>
        <Select
          aria-label="Preview count"
          value={previewCount}
          onChange={(event) => setPreviewCount(Number(event.target.value))}
          className={selectFieldClasses}
        >
          {previewCountOptions.map((count) => (
            <option key={count} value={count}>
              {count} component{count > 1 ? "s" : ""}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );

  const imageControls = (
    <div className="flex flex-wrap items-center gap-3">
      {imageOptions.length > 0 ? (
        <label className="flex flex-col gap-1">
          <span className={selectLabelClasses}>Image</span>
          <Select
            aria-label="Select stored image"
            value={selectedImageId}
            disabled={imageLoading}
            onChange={(event) => setSelectedImageId(event.target.value)}
            className={`${selectFieldClasses} min-w-[14rem]`}
          >
            {imageOptions.map((image) => (
              <option key={image.id} value={image.id}>
                {image.label}
              </option>
            ))}
          </Select>
        </label>
      ) : (
        <span className={selectLabelClasses}>
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

  const aboutFounderPreview = {
    name: "Chris Meisner",
    title: "Founder & Creative Director",
    imageSrc: "/founder.jpg",
    socialLinks: [
      { label: "LinkedIn", href: "https://linkedin.com/in/chrismeisner" },
      { label: "Twitter", href: "https://twitter.com/chrismeisner" },
    ],
    experienceLinks: [
      { label: "NYTimes feature — Fast launches", href: "https://www.nytimes.com/" },
      { label: "TechCrunch — Studio playbooks", href: "https://techcrunch.com/" },
      { label: "Case study — Global retail sprint", href: "/work" },
    ],
    bio: (
      <>
        <p>
          I&apos;ve led sprints for pre-seed teams and public companies alike. Every engagement hinges on decisive direction, premium execution, and zero wasted cycles.
        </p>
        <p>
          This studio packages those reps into a repeatable climb founders can trust whenever they need another leap forward.
        </p>
      </>
    ),
  };

  const sectionsByKey: Record<ComponentKey, () => JSX.Element> = {
    sectionIntro: () => (
      <ComponentSection
        key="sectionIntro"
        title={componentLabelMap.sectionIntro}
        meta={
          <WidthRuler
            targetRef={sectionIntroPanelRef}
            label={`${componentLabelMap.sectionIntro} width`}
            className={widthRulerClassName}
          />
        }
        showDetails={showSectionDetails}
      >
        <div ref={sectionIntroPanelRef} className={previewSurfaceClassName}>
          <SectionIntro {...sectionIntroPreview} />
        </div>
      </ComponentSection>
    ),
    sectionHeader: () => (
      <ComponentSection
        key="sectionHeader"
        title={componentLabelMap.sectionHeader}
        meta={
          <WidthRuler
            targetRef={sectionHeaderPanelRef}
            label={`${componentLabelMap.sectionHeader} width`}
            className={widthRulerClassName}
          />
        }
        showDetails={showSectionDetails}
      >
        <div ref={sectionHeaderPanelRef} className={previewSurfaceClassName}>
          <SectionHeader
            {...sectionHeaderPreview}
            // SectionHeader is center-aligned internally; pass explicit maxWidth if needed
            maxWidth="md"
          />
        </div>
      </ComponentSection>
    ),
    howItWorks: () => (
      <ComponentSection
        key="howItWorks"
        title={componentLabelMap.howItWorks}
        meta={
          <WidthRuler
            targetRef={howItWorksPanelRef}
            label={`${componentLabelMap.howItWorks} width`}
            className={widthRulerClassName}
          />
        }
        showDetails={showSectionDetails}
      >
        <div ref={howItWorksPanelRef} className={previewSurfaceClassName}>
          <HowItWorksSteps steps={howItWorksStepsPreview} />
        </div>
      </ComponentSection>
    ),
    faq: () => (
      <ComponentSection
        key="faq"
        title={componentLabelMap.faq}
        meta={
          <WidthRuler
            targetRef={faqPanelRef}
            label={`${componentLabelMap.faq} width`}
            className={widthRulerClassName}
          />
        }
        showDetails={showSectionDetails}
      >
        <div ref={faqPanelRef} className={previewSurfaceClassName}>
          <FAQSection {...faqPreview} />
        </div>
      </ComponentSection>
    ),
    hero: () => (
      <ComponentSection
        key="hero"
        title={componentLabelMap.hero}
        meta={
          <WidthRuler
            targetRef={heroPanelRef}
            label={`${componentLabelMap.hero} width`}
            className={widthRulerClassName}
          />
        }
        showDetails={showSectionDetails}
      >
        <div ref={heroPanelRef} className={previewSurfaceClassName}>
          <HeroSection
            {...heroPreviewProps}
            minHeight={false}
            className="bg-transparent"
          />
        </div>
      </ComponentSection>
    ),
    image: () => (
      <ComponentSection
        key="image"
        title={componentLabelMap.image}
        meta={
          <WidthRuler
            targetRef={imagePanelRef}
            label={`${componentLabelMap.image} width`}
            className={widthRulerClassName}
          />
        }
        controls={imageControls}
        showDetails={showSectionDetails}
      >
        <div ref={imagePanelRef} className={previewSurfaceClassName}>
          <ComponentContainer>
            <div className="space-y-4">
              <div className="relative overflow-hidden border border-black/10 bg-black/5 text-white shadow-sm dark:border-white/15 dark:bg-white/5">
                {selectedImage ? (
                  <div className="relative h-[420px] w-full">
                    <Image
                      src={selectedImage.url}
                      alt={selectedImage.label}
                      fill
                      sizes="(min-width: 1024px) 900px, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
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
        </div>
      </ComponentSection>
    ),
    gettingStarted: () => (
      <ComponentSection
        key="gettingStarted"
        title={componentLabelMap.gettingStarted}
        showDetails={showSectionDetails}
        controls={
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={selectLabelClasses}>Steps shown</span>
              <Select
                value={gettingStartedCount}
                onChange={(event) => setGettingStartedCount(Number(event.target.value))}
                className={selectFieldClasses}
              >
                {[2, 4, 6].map((count) => (
                  <option key={`steps-${count}`} value={count}>
                    {count} steps
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={selectLabelClasses}>Style</span>
              <Select
                value={gettingStartedVariant}
                onChange={(event) => setGettingStartedVariant(event.target.value as "card" | "flat")}
                className={selectFieldClasses}
              >
                <option value="card">Card</option>
                <option value="flat">Flat</option>
              </Select>
            </label>
          </div>
        }
      >
        <div className={gettingStartedLayoutClass}>
          {Array.from({ length: gettingStartedCount }).map((_, index) => (
            <GettingStartedStep
              key={`getting-started-${index}`}
              number={String(index + 1).padStart(2, "0")}
              title={`Sample step ${index + 1}`}
              body="Use GettingStartedStep for onboarding instructions or repeatable playbooks inside marketing pages."
              variant={gettingStartedVariant}
            />
          ))}
        </div>
      </ComponentSection>
    ),
    packageCard: () => (
      <ComponentSection
        key="packageCard"
        title={componentLabelMap.packageCard}
        meta={
          <WidthRuler
            targetRef={packagePanelRef}
            label={`${componentLabelMap.packageCard} width`}
            className={widthRulerClassName}
          />
        }
        controls={packageControls}
        showDetails={showSectionDetails}
      >
        <div ref={packagePanelRef} className={previewSurfaceClassName}>
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
        </div>
      </ComponentSection>
    ),
    aboutFounder: () => (
      <ComponentSection key="aboutFounder" title={componentLabelMap.aboutFounder} showDetails={showSectionDetails}>
        <ComponentContainer constrainWidth={false}>
          <AboutFounder {...aboutFounderPreview} />
        </ComponentContainer>
      </ComponentSection>
    ),
    footer: () => (
      <ComponentSection key="footer" title={componentLabelMap.footer} showDetails={showSectionDetails}>
        <Footer />
      </ComponentSection>
    ),
  };

  return (
    <div
      ref={rootRef}
      className={`container max-w-7xl space-y-16 px-6 py-12 lg:px-8 ${showTypographyLabels ? "typography-label-mode" : ""}`}
    >
      <div className="space-y-4">
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
          <div className="inline-flex flex-wrap items-center gap-4">
            <label className={controlLabelClasses}>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-black/20 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/40 dark:bg-black dark:text-white"
                checked={showContainerStroke}
                onChange={(event) => setShowContainerStroke(event.target.checked)}
              />
              Show container stroke
            </label>
            <label className={controlLabelClasses}>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-black/20 text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black dark:border-white/40 dark:bg-black dark:text-white"
                checked={showSectionDetails}
                onChange={(event) => setShowSectionDetails(event.target.checked)}
              />
              Show section details
            </label>
            <label className={controlLabelClasses}>
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
        {showSectionDetails && (
          <WidthRuler targetRef={rootRef} label="Preview canvas width" className={widthRulerClassName} />
        )}
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
  meta?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  showDetails?: boolean;
};

function ComponentSection({ title, meta, controls, children, showDetails = true }: ComponentSectionProps) {
  return (
    <section className="space-y-4">
      {showDetails && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge variant="subtle">{title}</Badge>
          {controls && <div className="flex flex-wrap items-center gap-3">{controls}</div>}
        </div>
      )}
      <div className="space-y-3">
        {children}
        {showDetails && meta}
      </div>
    </section>
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

