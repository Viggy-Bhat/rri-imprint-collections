"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function formatSegmentLabel(segment) {
  const value = String(segment || "").trim();

  if (!value) {
    return "";
  }

  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toEncodedPath(segments) {
  return `/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
}

function buildItems(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  const items = [{ label: "Home", href: "/", isActive: false }];

  // Canonical researcher routes: /researcher/:slug[/section/:sectionSlug]
  if (segments[0] === "researcher" && segments[1]) {
    const slug = segments[1];

    items.push({
      label: formatSegmentLabel(slug),
      href: `/researcher/${encodeURIComponent(slug)}`,
      isActive: segments.length === 2,
    });

    if (segments[2] === "section" && segments[3]) {
      items.push({
        label: formatSegmentLabel(segments[3]),
        href: null,
        isActive: true,
      });
      return items;
    }

    if (segments.length > 2) {
      items.push({
        label: formatSegmentLabel(segments[segments.length - 1]),
        href: null,
        isActive: true,
      });
    }

    return items;
  }

  // Legacy gallery route shape used by the app: /researchers/:slug/gallery
  if (segments[0] === "researchers" && segments[1]) {
    const slug = segments[1];

    items.push({
      label: formatSegmentLabel(slug),
      href: `/researcher/${encodeURIComponent(slug)}`,
      isActive: segments.length === 2,
    });

    if (segments[2]) {
      items.push({
        label: formatSegmentLabel(segments[2]),
        href: null,
        isActive: true,
      });
    }

    return items;
  }

  // Safe fallback: only link to routes that definitely exist in this project.
  items.push({
    label: formatSegmentLabel(segments[segments.length - 1]) || "Page",
    href: null,
    isActive: true,
  });

  return items;
}

export function PageBreadcrumb() {
  const pathname = usePathname() || "";

  if (pathname === "/") {
    return null;
  }

  const items = buildItems(pathname);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-8">
      <nav aria-label="Breadcrumb" className="text-sm sm:text-base text-red-900/80">
        <ol className="flex flex-wrap items-center gap-y-1">
          {items.map((item, index) => {
            const showSeparator = index < items.length - 1;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center">
                {item.isActive || !item.href ? (
                  <span className="font-semibold text-red-900" aria-current={item.isActive ? "page" : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:underline underline-offset-2">
                    {item.label}
                  </Link>
                )}

                {showSeparator ? <span className="mx-2 text-red-900/60">/</span> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
