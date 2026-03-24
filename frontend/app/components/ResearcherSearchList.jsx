"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export function ResearcherSearchList({ researchers = [] }) {
  const [query, setQuery] = useState("");

  const filteredResearchers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return researchers;
    }

    return researchers.filter((page) =>
      String(page?.title || "").toLowerCase().includes(normalizedQuery)
    );
  }, [researchers, query]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="researcher-search" className="block text-sm font-semibold tracking-wide text-red-800">
          Search researchers
        </label>
        <input
          id="researcher-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Type a name..."
          className="w-full rounded-lg border border-red-200 bg-amber-50/30 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      <p className="text-sm text-gray-600">
        Showing {filteredResearchers.length} of {researchers.length} researchers
      </p>

      {filteredResearchers.length === 0 ? (
        <p className="text-gray-600">No researchers match your search.</p>
      ) : (
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredResearchers.map((page) => {
            const slug = page?.meta?.slug || page?.slug;

            return (
              <li
                key={page.id}
                className="list-decimal list-inside marker:text-red-700 marker:font-semibold rounded-lg border border-red-100 bg-amber-50/40 px-3 py-2"
              >
                <Link
                  href={`/researcher/${slug}`}
                  className="text-gray-800 font-medium hover:text-red-700 hover:underline transition"
                >
                  {page.title}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
