"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
  return `/${segments.slice(0, index + 1).map(encodeURIComponent).join("/")}`;
}

function buildBreadcrumbItems(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Home", href: "/" }];
  }

  if (segments[0] === "researcher" && segments[1]) {
    const items = [
      { label: "Home", href: "/" },
      { label: "Researcher", href: "/" },
    ];

    const slug = segments[1];

    if (segments.length === 2) {
      items.push({
        label: formatSegmentLabel(slug),
        href: `/researcher/${encodeURIComponent(slug)}`,
      });
      return items;
    }

    if (segments[2] === "section" && segments[3]) {
      items.push({
        label: formatSegmentLabel(slug),
        href: `/researcher/${encodeURIComponent(slug)}`,
      });
      items.push({
        label: formatSegmentLabel(segments[3]),
        href: `/${segments.map(encodeURIComponent).join("/")}`,
      });
      return items;
    }

    items.push({
      label: formatSegmentLabel(slug),
      href: `/researcher/${encodeURIComponent(slug)}`,
    });

    items.push({
      label: formatSegmentLabel(segments[segments.length - 1]),
      href: `/${segments.map(encodeURIComponent).join("/")}`,
    });

    return items;
  }

  const items = [{ label: "Home", href: "/" }];

  segments.forEach((segment, index) => {
    items.push({
      label: formatSegmentLabel(segment),
      href: buildHref(segments, index),
    });
  });

  return items;
}

export function PreFooterNavigation() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const items = buildBreadcrumbItems(pathname);

  return (
    <section
      aria-label="Page navigation"
      className="w-full mt-16 border-y border-red-800/70 bg-[url('/assets/background/rri-pattern.png')] bg-repeat bg-center"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4" aria-label="Breadcrumb navigation">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
                return;
              }

              router.push("/");
            }}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center shadow-md hover:bg-red-800 transition"
          >
            {"<<"}
          </button>

          <nav aria-label="Breadcrumb" className="text-sm sm:text-base text-red-900/80">
            <ol className="flex flex-wrap justify-center gap-y-1">
              {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                  <li key={`${item.label}-${index}`} className="flex items-center">
                    {isLast ? (
                      <span className="font-semibold text-red-900">{item.label}</span>
                    ) : (
                      <Link href={item.href} className="hover:underline underline-offset-2">
                        {item.label}
                      </Link>
                    )}

                    {index < items.length - 1 && <span className="mx-2 text-red-900/60">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    </section>
  );
}
