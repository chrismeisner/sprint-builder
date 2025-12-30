"use client";

import Image from "next/image";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  year: number | null;
  involvement_type: string;
  project_scale: string;
  industry: string;
  outcomes: {
    metrics: string[];
    testimonial: {
      quote: string;
      author: string;
      role: string;
    } | null;
  };
  thumbnail_url: string;
  images: string[];
  project_url: string;
  published: boolean;
  featured: boolean;
};

type Props = {
  project?: Project;
  mode: "create" | "edit";
};

export default function ProjectFormClient({ project, mode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [title, setTitle] = useState(project?.title || "");
  const [slug, setSlug] = useState(project?.slug || "");
  const [description, setDescription] = useState(project?.description || "");
  const [story, setStory] = useState(project?.story || "");
  const [year, setYear] = useState<string>(project?.year?.toString() || "");
  const [involvementType, setInvolvementType] = useState(project?.involvement_type || "");
  const [projectScale, setProjectScale] = useState(project?.project_scale || "");
  const [industry, setIndustry] = useState(project?.industry || "");
  const [metricsText, setMetricsText] = useState(project?.outcomes?.metrics?.join("\n") || "");
  const [testimonialQuote, setTestimonialQuote] = useState(project?.outcomes?.testimonial?.quote || "");
  const [testimonialAuthor, setTestimonialAuthor] = useState(project?.outcomes?.testimonial?.author || "");
  const [testimonialRole, setTestimonialRole] = useState(project?.outcomes?.testimonial?.role || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(project?.thumbnail_url || "");
  const [imagesText, setImagesText] = useState(project?.images?.join("\n") || "");
  const [projectUrl, setProjectUrl] = useState(project?.project_url || "");
  const [published, setPublished] = useState(project?.published ?? false);
  const [featured, setFeatured] = useState(project?.featured ?? false);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === "create") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  };

  const handleImageUpload = async (file: File, target: "thumbnail" | "gallery") => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      
      if (target === "thumbnail") {
        setThumbnailUrl(data.url);
      } else {
        const currentImages = imagesText.trim() ? imagesText.split("\n") : [];
        setImagesText([...currentImages, data.url].join("\n"));
      }

      alert("Image uploaded successfully!");
    } catch (error) {
      alert(`Upload failed: ${error}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse metrics and images
      const metrics = metricsText
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean);
      
      const images = imagesText
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean);

      const testimonial =
        testimonialQuote.trim() && testimonialAuthor.trim()
          ? {
              quote: testimonialQuote.trim(),
              author: testimonialAuthor.trim(),
              role: testimonialRole.trim() || "",
            }
          : null;

      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        story: story.trim() || null,
        year: year.trim() ? parseInt(year) : null,
        involvement_type: involvementType.trim() || null,
        project_scale: projectScale.trim() || null,
        industry: industry.trim() || null,
        outcomes: {
          metrics,
          testimonial,
        },
        thumbnail_url: thumbnailUrl.trim() || null,
        images: images.length > 0 ? images : null,
        project_url: projectUrl.trim() || null,
        published,
        featured,
      };

      const url = mode === "create" 
        ? "/api/admin/projects"
        : `/api/admin/projects/${project?.id}`;
      
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save project");
      }

      alert(mode === "create" ? "Project created!" : "Project updated!");
      router.push("/dashboard/projects");
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            placeholder="Wink - Smart Home Hub"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium mb-1">
            Slug * <span className="text-xs opacity-60">(URL-friendly, auto-generated)</span>
          </label>
          <input
            id="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent font-mono text-sm"
            placeholder="wink-smart-home"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Short Description <span className="text-xs opacity-60">(1-2 sentences, shown in cards)</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            placeholder="Led product vision for a unified smart home platform..."
          />
        </div>

        <div>
          <label htmlFor="story" className="block text-sm font-medium mb-1">
            Full Story <span className="text-xs opacity-60">(optional, shown on detail page)</span>
          </label>
          <textarea
            id="story"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            placeholder="The project started when..."
          />
        </div>
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Metadata</h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium mb-1">
              Year
            </label>
            <input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
              placeholder="2015"
            />
          </div>

          <div>
            <label htmlFor="involvement_type" className="block text-sm font-medium mb-1">
              Involvement Type
            </label>
            <select
              id="involvement_type"
              value={involvementType}
              onChange={(e) => setInvolvementType(e.target.value)}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            >
              <option value="">Select...</option>
              <option value="founder">Founder</option>
              <option value="cofounder">Co-founder</option>
              <option value="full-time">Full-time</option>
              <option value="contractor">Contractor</option>
              <option value="agency">Agency Work</option>
              <option value="advisor">Advisor</option>
            </select>
          </div>

          <div>
            <label htmlFor="project_scale" className="block text-sm font-medium mb-1">
              Project Scale
            </label>
            <select
              id="project_scale"
              value={projectScale}
              onChange={(e) => setProjectScale(e.target.value)}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            >
              <option value="">Select...</option>
              <option value="startup">Startup</option>
              <option value="smb">SMB</option>
              <option value="enterprise">Enterprise</option>
              <option value="side-project">Side Project</option>
            </select>
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium mb-1">
              Industry
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
              placeholder="iot, fintech, saas, etc."
            />
          </div>
        </div>

        <div>
          <label htmlFor="project_url" className="block text-sm font-medium mb-1">
            Project URL <span className="text-xs opacity-60">(optional, live site or case study)</span>
          </label>
          <input
            id="project_url"
            type="url"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Outcomes */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Outcomes & Metrics</h2>
        
        <div>
          <label htmlFor="metrics" className="block text-sm font-medium mb-1">
            Key Metrics <span className="text-xs opacity-60">(one per line)</span>
          </label>
          <textarea
            id="metrics"
            value={metricsText}
            onChange={(e) => setMetricsText(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent font-mono text-sm"
            placeholder="400+ connected device integrations&#10;Featured in New York Times&#10;Successfully acquired"
          />
        </div>

        <div className="border-t border-black/10 dark:border-white/15 pt-4">
          <h3 className="text-sm font-semibold mb-3">Testimonial (optional)</h3>
          
          <div className="space-y-3">
            <textarea
              id="testimonial_quote"
              value={testimonialQuote}
              onChange={(e) => setTestimonialQuote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
              placeholder="They moved faster than any agency we'd worked with."
            />
            
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={testimonialAuthor}
                onChange={(e) => setTestimonialAuthor(e.target.value)}
                className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
                placeholder="Author name"
              />
              <input
                type="text"
                value={testimonialRole}
                onChange={(e) => setTestimonialRole(e.target.value)}
                className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent"
                placeholder="Role / Company"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Images</h2>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Thumbnail Image <span className="text-xs opacity-60">(main image for cards)</span>
          </label>
          <div className="flex items-start gap-3">
            <input
              type="text"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="flex-1 rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent text-sm"
              placeholder="https://... or upload below"
            />
            <label className="inline-flex items-center rounded-md bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium hover:opacity-90 cursor-pointer">
              {uploadingImage ? "Uploading..." : "Upload"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "thumbnail");
                }}
              />
            </label>
          </div>
          {thumbnailUrl && (
            <div className="mt-2 max-w-xs">
              <Image
                src={thumbnailUrl}
                alt="Thumbnail preview"
                width={320}
                height={200}
                className="h-auto w-full rounded border border-black/10 dark:border-white/15"
                unoptimized
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Gallery Images <span className="text-xs opacity-60">(one URL per line)</span>
          </label>
          <div className="space-y-2">
            <textarea
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-black/10 dark:border-white/15 px-3 py-2 bg-transparent font-mono text-sm"
              placeholder="https://...&#10;https://..."
            />
            <label className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
              {uploadingImage ? "Uploading..." : "+ Upload to Gallery"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "gallery");
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-lg border border-black/10 dark:border-white/15 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Status</h2>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Published (visible on /work)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Featured (hero section)</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-black/10 dark:border-white/15 px-6 py-2 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="rounded-md bg-black dark:bg-white text-white dark:text-black px-6 py-2 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "create" ? "Create Project" : "Update Project"}
        </button>
      </div>
    </form>
  );
}

