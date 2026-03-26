"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";

export function SidebarNavigation({ researcherSlug, sidebarItems = [], useHashLinks = false }) {
  const pathname = usePathname() || "";

  const items = Array.isArray(sidebarItems) ? sidebarItems : [];

  const handleAnchorClick = (event, slug) => {
    event.preventDefault();

    const target = document.getElementById(slug);

    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${slug}`);
  };

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <Card className="p-6 space-y-4 bg-[#efe9dc] border-[#d9cfc1]">
        <div className="space-y-2 pb-4 border-b-2 border-[#8b1c1c]/20">
          <h2 className="font-serif text-xl font-semibold text-[#8b1c1c]">
            Sections
          </h2>
          <div className="h-1 w-12 bg-[#8b1c1c]"></div>
        </div>

        <nav className="space-y-3" aria-label="Sidebar navigation">
          {items.length === 0 ? (
            <p className="text-neutral-600 text-sm py-4">No sections available</p>
          ) : (
            items.map((item) => {
              const href = `/researcher/${researcherSlug}/section/${item.slug}`;
              const hashHref = `#${item.slug}`;
              const isActive = useHashLinks
                ? typeof window !== "undefined" && window.location.hash === hashHref
                : pathname === href || pathname === `${href}/`;

              const className = `block p-4 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? "bg-white border-[#8b1c1c] shadow-md"
                  : "bg-white/60 border-[#d9cfc1] hover:bg-white hover:border-[#c4b5a0]"
              }`;

              const content = (
                <>
                  <p className={`font-semibold text-sm leading-snug ${
                    isActive ? "text-[#8b1c1c]" : "text-neutral-800"
                  }`}>
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-neutral-600 mt-1 leading-snug">
                      {item.subtitle}
                    </p>
                  )}
                </>
              );

              if (useHashLinks) {
                return (
                  <a
                    key={item.slug}
                    href={hashHref}
                    className={className}
                    onClick={(event) => handleAnchorClick(event, item.slug)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={item.slug}
                  href={href}
                  className={className}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            })
          )}
        </nav>
      </Card>
    </aside>
  );
}
