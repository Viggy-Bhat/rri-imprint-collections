"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export function ResearcherSearchList({ researchers = [], labels = {} }) {
  const [query, setQuery] = useState("");
  const {
    search = "Search researchers",
    countSuffix = "researchers",
    noMatches = "No researchers match your search.",
  } = labels;

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
          {search}
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
        Showing {filteredResearchers.length} of {researchers.length} {countSuffix}
      </p>

      {filteredResearchers.length === 0 ? (
        <p className="text-gray-600">{noMatches}</p>
      ) : (
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredResearchers.map((page) => {
            const slug = page?.meta?.slug || page?.slug;

            return (
              <li
                key={page.id}
                className="group list-decimal list-inside marker:text-red-700 marker:font-semibold rounded-lg border border-red-100 bg-amber-50/40 px-3 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-red-300 hover:bg-amber-100/50"
              >
                <Link
                  href={`/researcher/${slug}`}
                  className="text-gray-800 font-medium transition-colors duration-200 group-hover:text-red-900"
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
