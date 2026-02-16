import Image from "next/image";
import type { ReactNode } from "react";
import { typography } from "./typography";

type AboutFounderProps = {
  name: string;
  title: string;
  bio: ReactNode;
  imageSrc: string;
  imageAlt?: string;
  socialLinks?: Array<{ label: string; href: string }>;
  experienceLinks?: Array<{ label: string; href: string }>;
};

export default function AboutFounder({
  name,
  title,
  bio,
  imageSrc,
  imageAlt = name,
  socialLinks = [],
  experienceLinks = [],
}: AboutFounderProps) {
  return (
    <section className="container max-w-6xl py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <h2 className={`${typography.headingSection} text-balance`}>{name}</h2>
          <p className={`${typography.bodyBase} text-text-secondary`}>{title}</p>
          <div className={`${typography.bodyBase} text-text-secondary space-y-3`}>{bio}</div>

          {(socialLinks.length > 0 || experienceLinks.length > 0) && (
            <div className="space-y-4">
              {socialLinks.length > 0 && (
                <div className="space-y-2">
                  <p className={`${typography.bodySm} text-text-muted`}>Connect</p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`${typography.bodyBase} text-text-primary underline decoration-dotted`}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {experienceLinks.length > 0 && (
                <div className="space-y-2">
                  <p className={`${typography.bodySm} text-text-muted`}>Featured in</p>
                  <ul className="space-y-1">
                    {experienceLinks.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`${typography.bodyBase} text-text-primary underline decoration-dotted`}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-stroke-muted bg-surface-subtle">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={600}
            height={720}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

