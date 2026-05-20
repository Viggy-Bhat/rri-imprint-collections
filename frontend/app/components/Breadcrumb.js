"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function formatSegmentLabel(segment) {
  return String(segment || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildSegmentHref(segments, index) {
  return `/${segments.slice(0, index + 1).map(encodeURIComponent).join("/")}`;
}

function buildBreadcrumbItems(pathname, researcherTitle, slug) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  if (segments[0] === "researcher" && segments[1]) {
    const items = [
      {
        label: "Home",
        href: "/",
        isActive: false,
      },
    ];

    const researcherLabel = researcherTitle || formatSegmentLabel(segments[1]);
    const researcherHref = slug
      ? `/researcher/${encodeURIComponent(slug)}`
      : `/researcher/${encodeURIComponent(segments[1])}`;

    items.push({
      label: researcherLabel,
      href: researcherHref,
      isActive: segments.length === 2,
    });

    if (segments.length > 2) {
      const lastSegment = segments[segments.length - 1];

      items.push({
        label:
          segments[2] === "section" && segments[3]
            ? formatSegmentLabel(segments[3])
            : formatSegmentLabel(lastSegment),
        href: pathname,
        isActive: true,
      });
    }

    return items;
  }

  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1;

    return {
      label: formatSegmentLabel(segment),
      href: isLast ? null : buildSegmentHref(segments, index),
      isActive: isLast,
    };
  });
}

export function Breadcrumb({ researcherTitle, slug }) {
  const pathname = usePathname() || "";
  const breadcrumbItems = buildBreadcrumbItems(pathname, researcherTitle, slug);

  if (breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500 mb-6">
      <ol className="flex flex-wrap gap-1">
        {breadcrumbItems.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {item.isActive || !item.href ? (
              <span className="text-gray-700 font-medium" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="hover:underline cursor-pointer">
                {item.label}
              </Link>
            )}

            {index < breadcrumbItems.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
