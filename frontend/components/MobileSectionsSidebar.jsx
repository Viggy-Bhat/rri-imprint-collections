"use client";

import Link from "next/link";
import { useState } from "react";

export default function MobileSectionsSidebar({
  researcherSlug,
  sections = [],
  useHashLinks = false,
}) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(sections) ? sections : [];

  const handleClose = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-full bg-[#8b1c1c] px-3 py-2 text-sm font-semibold text-white shadow-lg md:hidden"
        aria-label="Open sections menu"
      >
        ☰
      </button>

      {open ? (
        <button
          type="button"
          onClick={handleClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close sections menu overlay"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex h-full flex-col overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between border-b border-red-100 pb-4">
            <h2 className="font-serif text-xl font-semibold text-[#8b1c1c]">Sections</h2>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-[#8b1c1c]"
              aria-label="Close sections menu"
            >
              Close
            </button>
          </div>

          <nav className="space-y-3" aria-label="Mobile sections navigation">
            {items.length === 0 ? (
              <p className="text-sm text-neutral-600">No sections available</p>
            ) : (
              items.map((item) => {
                const isGalleryItem = item.slug === "gallery";
                const href = isGalleryItem
                  ? `/researchers/${encodeURIComponent(researcherSlug)}/gallery`
                  : `/researcher/${encodeURIComponent(researcherSlug)}/section/${encodeURIComponent(item.slug)}`;
                const hashHref = `#${item.slug}`;

                const content = (
                  <>
                    <p className="font-semibold text-sm leading-snug text-neutral-900">{item.title}</p>
                    {item.subtitle ? (
                      <p className="mt-1 text-xs leading-snug text-neutral-600">{item.subtitle}</p>
                    ) : null}
                  </>
                );

                if (useHashLinks) {
                  return (
                    <a
                      key={item.slug}
                      href={hashHref}
                      className="block rounded-lg border border-red-100 bg-amber-50/60 p-4"
                      onClick={handleClose}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.slug}
                    href={href}
                    className="block rounded-lg border border-red-100 bg-amber-50/60 p-4"
                    onClick={handleClose}
                  >
                    {content}
                  </Link>
                );
              })
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}