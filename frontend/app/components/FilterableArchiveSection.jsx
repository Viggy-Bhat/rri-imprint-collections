"use client";

import { useEffect, useState, useCallback } from "react";
import { SidebarItemCard } from "@/app/components/SidebarItemCard";
import { getWagtailBackendBaseUrl } from "@/app/lib/config";
import ArchiveFilterPanel from "@/components/ArchiveFilterPanel";

const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();
const PAGE_SIZE = 10;

export function FilterableArchiveSection({ researcherSlug, sectionType }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [draftSortOption, setDraftSortOption] = useState("title_asc");
  const [draftYear, setDraftYear] = useState("");

  const fetchPage = useCallback(async (newOffset, searchTerm, sortOption, year) => {
    if (!researcherSlug || !sectionType) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      query.set("limit", String(PAGE_SIZE));
      query.set("offset", String(Math.max(newOffset, 0)));
      query.set("sort", sortOption || "title_asc");

      if (searchTerm) {
        query.set("search", searchTerm);
      }

      if (year) {
        query.set("year", year);
      }

      const response = await fetch(
        `${WAGTAIL_BACKEND_BASE}/api/researchers/${encodeURIComponent(researcherSlug)}/${encodeURIComponent(sectionType)}/?${query.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(data.total || 0);
      setOffset(data.offset || 0);
      setHasNext(!!data.has_next);
      setHasPrevious(!!data.has_previous);
    } catch (err) {
      console.error("[FilterableArchiveSection] Failed to fetch page:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [researcherSlug, sectionType]);

  useEffect(() => {
    setDraftSearchTerm("");
    setDraftSortOption("title_asc");
    setDraftYear("");
    fetchPage(0, "", "title_asc", "");
  }, [fetchPage]);

  function handleApplyFilters() {
    const searchTerm = draftSearchTerm.trim();
    const sortOption = draftSortOption || "title_asc";
    const year = draftYear.trim();
    setOffset(0);
    fetchPage(0, searchTerm, sortOption, year);
  }

  function handleResetFilters() {
    setDraftSearchTerm("");
    setDraftSortOption("title_asc");
    setDraftYear("");
    setOffset(0);
    fetchPage(0, "", "title_asc", "");
  }

  function handleRetry() {
    fetchPage(offset, draftSearchTerm.trim(), draftSortOption, draftYear.trim());
  }

  function handleNextPage() {
    if (hasNext && !isLoading) {
      fetchPage(offset + PAGE_SIZE, draftSearchTerm.trim(), draftSortOption, draftYear.trim());
    }
  }

  function handlePreviousPage() {
    if (hasPrevious && !isLoading) {
      fetchPage(offset - PAGE_SIZE, draftSearchTerm.trim(), draftSortOption, draftYear.trim());
    }
  }

  const startItem = total > 0 ? offset + 1 : 0;
  const endItem = Math.min(offset + PAGE_SIZE, total);

  const hasActiveFilters = draftSearchTerm.trim() || draftYear.trim() || draftSortOption !== "title_asc";
  const isEmptyState = !isLoading && !error && items.length === 0;
  const isNoItemsAtAll = isEmptyState && total === 0 && !hasActiveFilters;
  const isNoMatchAfterFilter = isEmptyState && total > 0;

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
      <div className="justify-self-end w-full lg:max-w-90 order-1 lg:order-2">
        <ArchiveFilterPanel
          searchTerm={draftSearchTerm}
          sortOption={draftSortOption}
          year={draftYear}
          onSearchTermChange={setDraftSearchTerm}
          onSortOptionChange={setDraftSortOption}
          onYearChange={setDraftYear}
          onApplyFilters={handleApplyFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="min-w-0 w-full order-2 lg:order-1">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-red-100 bg-white/95 px-5 py-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-red-700 font-medium">Failed to load items</p>
            <button onClick={handleRetry} className="text-sm text-red-600 underline mt-1">
              Try again
            </button>
          </div>
        )}

        {isNoItemsAtAll && (
          <p className="text-gray-600">No items available in this section.</p>
        )}

        {isNoMatchAfterFilter && (
          <p className="text-gray-600">No items match your filters. Try adjusting your search.</p>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            <div className="space-y-3 w-full">
              {items.map((item, index) => (
                <SidebarItemCard
                  key={`item-${offset}-${index}`}
                  item={item}
                />
              ))}
            </div>

            {total > PAGE_SIZE ? (
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!hasPrevious || isLoading}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  &larr; Previous
                </button>

                <span className="text-sm text-gray-600">
                  Showing {startItem}&ndash;{endItem} of {total}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!hasNext || isLoading}
                  className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next &rarr;
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
