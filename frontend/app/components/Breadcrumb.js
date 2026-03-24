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
  return `/${segments.slice(0, index + 1).join("/")}`;
}

export function Breadcrumb({ researcherTitle, slug }) {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const breadcrumbItems = [];

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;

    if (segment === "researcher") {
      breadcrumbItems.push({
        label: "Home",
        href: "/",
        isActive: false,
      });
      return;
    }

    const isResearcherSlug = segments[0] === "researcher" && index === 1;

    if (isResearcherSlug) {
      breadcrumbItems.push({
        label: researcherTitle || formatSegmentLabel(segment),
        href: slug ? `/researcher/${slug}` : buildSegmentHref(segments, index),
        isActive: isLast,
      });
      return;
    }

    breadcrumbItems.push({
      label: formatSegmentLabel(segment),
      href: isLast ? null : buildSegmentHref(segments, index),
      isActive: isLast,
    });
  });

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
