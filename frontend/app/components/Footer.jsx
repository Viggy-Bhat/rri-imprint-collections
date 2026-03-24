"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FooterLeft } from "@/app/components/FooterLeft";
import { FooterRight } from "@/app/components/FooterRight";

function formatSegmentLabel(segment) {
  if (segment === "researcher") {
    return "Researcher";
  }

  return String(segment || "")
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildHref(segments, index) {
  return `/${segments.slice(0, index + 1).join("/")}`;
}

function FooterCenterBreadcrumb() {
  const pathname = usePathname() || "";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const items = [{ label: "Home", href: "/" }];

  segments.forEach((segment, index) => {
    items.push({
      label: formatSegmentLabel(segment),
      href: buildHref(segments, index),
    });
  });

  return (
    <nav aria-label="Footer breadcrumb" className="text-xs text-gray-500">
      <ol className="flex flex-wrap justify-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center">
              {isLast ? (
                <span className="text-gray-700 font-medium">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              )}

              {index < items.length - 1 && <span className="mx-2">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Footer({ settings }) {
  return (
    <footer className="w-full border-t border-red-200 mt-16 bg-amber-50/70" role="contentinfo">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-5 md:justify-between md:items-center py-7 px-4 text-center">
        <section className="w-full md:w-auto flex justify-center md:justify-start" aria-label="Footer navigation">
          <FooterLeft />
        </section>

        <section className="w-full md:flex-1 flex justify-center" aria-label="Footer path">
          <FooterCenterBreadcrumb />
        </section>

        <section className="w-full md:w-auto" aria-label="Institute information">
          <FooterRight settings={settings} />
        </section>
      </div>
    </footer>
  );
}
