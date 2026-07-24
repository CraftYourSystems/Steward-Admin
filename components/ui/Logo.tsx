"use client";

import React from "react";
import stewardLogo from "@/assets/logos/Steward_Logo.png";
import stewardNeedle from "@/assets/logos/Steward_Needle.png";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /**
   * Layout variant:
   * - 'full': Shows complete Steward logo (emblem + typography)
   * - 'icon': Shows emblem icon mark only (useful for collapsed sidebar or compact spaces)
   */
  variant?: "full" | "icon";
  /**
   * If true, renders compact emblem for collapsed sidebars
   */
  collapsed?: boolean;
  /**
   * Additional wrapper container class names
   */
  className?: string;
  /**
   * Image element class names
   */
  imgClassName?: string;
  /**
   * Accessible alt text. Defaults to "Steward Logo".
   */
  alt?: string;
  /**
   * Mark as decorative for screen readers (aria-hidden="true")
   */
  decorative?: boolean;
}

/**
  * Official Steward Logo Component.
  * Shared across Admin navigation, headers, loading states, and auth pages.
  */
export function Logo({
  variant = "full",
  collapsed = false,
  className,
  imgClassName,
  alt = "Steward Logo",
  decorative = false,
}: LogoProps) {
  const isIconOnly = variant === "icon" || collapsed;
  const fullLogoSrc = typeof stewardLogo === "string" ? stewardLogo : stewardLogo.src ?? "/assets/steward-logo.png";
  const needleSrc = typeof stewardNeedle === "string" ? stewardNeedle : stewardNeedle.src ?? "/symbol-white.png";

  if (isIconOnly) {
    return (
      <div
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2/80 border border-white/10 p-1 shadow-sm transition-all duration-300",
          className
        )}
        title="Steward"
      >
        <img
          src={needleSrc}
          alt={decorative ? "" : alt}
          aria-hidden={decorative ? "true" : undefined}
          className={cn("h-full w-full object-contain shrink-0 select-none", imgClassName)}
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center shrink-0 select-none", className)}>
      <img
        src={fullLogoSrc}
        alt={decorative ? "" : alt}
        aria-hidden={decorative ? "true" : undefined}
        className={cn("h-7 w-auto object-contain shrink-0 transition-all duration-300", imgClassName)}
        decoding="async"
      />
    </div>
  );
}

export default Logo;
