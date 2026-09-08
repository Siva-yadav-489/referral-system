"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  backLink?: {
    href: string;
    label: string;
  };
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  backLink,
  children,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {backLink && (
        <div>
          <Link
            href={backLink.href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>{backLink.label}</span>
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>

        {children && (
          <div className="flex flex-wrap items-center gap-2.5">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
