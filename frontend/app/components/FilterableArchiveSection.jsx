"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarItemCard } from "@/app/components/SidebarItemCard";
import { getWagtailBackendBaseUrl } from "@/app/lib/config";
import ArchiveFilterPanel from "@/components/ArchiveFilterPanel";

const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();

function toPlainText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLabeledSegment(source, labels) {
  const text = toPlainText(source);

  if (!text) {
    return "";
  }

  for (const label of labels) {
    const expression = new RegExp(`${label}\\s*[:\\-]\\s*([^|,;\\n]+)`, "i");
    const match = text.match(expression);

    if (match?.[1]) {
      return String(match[1]).trim();
    }
  }

  return "";
}

function getAuthor(publication) {
  return (
    extractLabeledSegment(publication?.meta_text, ["author", "authors"]) ||
    extractLabeledSegment(publication?.description, ["author", "authors"]) ||
    toPlainText(publication?.author)
  );
}

function getJournal(publication) {
  return (
    extractLabeledSegment(publication?.meta_text, ["journal", "published in", "publication", "conference"]) ||
    extractLabeledSegment(publication?.description, ["journal", "published in", "publication", "conference"]) ||
    toPlainText(publication?.journal)
  );
}

function getYear(publication) {
  const directYear = Number(publication?.year);
  if (Number.isFinite(directYear) && directYear > 0) {
    return directYear;
  }

  const text = [publication?.meta_text, publication?.description, publication?.tag]
    .map(toPlainText)
    .filter(Boolean)
    .join(" ");

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? Number(yearMatch[0]) : null;
}

function sortResults(results, sortOption) {
  const sorted = [...results];

  switch (sortOption) {
    case "title_desc":
      return sorted.sort((a, b) => String(b?.title || "").localeCompare(String(a?.title || "")));
    case "author_asc":
      return sorted.sort((a, b) => getAuthor(a).localeCompare(getAuthor(b)));
    case "author_desc":
      return sorted.sort((a, b) => getAuthor(b).localeCompare(getAuthor(a)));
    case "journal_asc":
      return sorted.sort((a, b) => getJournal(a).localeCompare(getJournal(b)));
    case "newest":
      return sorted.sort((a, b) => (getYear(b) || 0) - (getYear(a) || 0));
    case "oldest":
      return sorted.sort((a, b) => (getYear(a) || 0) - (getYear(b) || 0));
    case "title_asc":
    default:
      return sorted.sort((a, b) => String(a?.title || "").localeCompare(String(b?.title || "")));
  }
}

function filterResultsLocally(items, searchTerm, sortOption, year) {
  const publications = Array.isArray(items) ? items : [];
  const normalizedSearch = String(searchTerm || "").toLowerCase().trim();
  const yearNumber = Number(year);
  const hasYear = Number.isFinite(yearNumber) && String(year || "").trim() !== "";

  let results = publications;

  if (normalizedSearch) {
    results = results.filter((publication) => {
      const searchMatch =
        toPlainText(publication?.title).toLowerCase().includes(normalizedSearch) ||
        getAuthor(publication).toLowerCase().includes(normalizedSearch) ||
        getJournal(publication).toLowerCase().includes(normalizedSearch);

      return searchMatch;
    });
  }

  if (hasYear) {
    results = results.filter((publication) => getYear(publication) === yearNumber);
  }

  return sortResults(results, sortOption || "title_asc");
}

export function FilterableArchiveSection({ items = [], researcherSlug, sectionSlug }) {
  const publications = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [draftSortOption, setDraftSortOption] = useState("title_asc");
  const [draftYear, setDraftYear] = useState("");
  const [displayedResults, setDisplayedResults] = useState(publications);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    setDisplayedResults(publications);
    setDraftSearchTerm("");
    setDraftSortOption("title_asc");
    setDraftYear("");
    setIsApplyingFilters(false);
  }, [publications]);

  async function handleApplyFilters() {
    const searchTerm = draftSearchTerm.trim();
    const sortOption = draftSortOption || "title_asc";
    const year = draftYear.trim();

    if (!researcherSlug || !sectionSlug) {
      setDisplayedResults(filterResultsLocally(publications, searchTerm, sortOption, year));
      return;
    }

    setIsApplyingFilters(true);

    try {
      const query = new URLSearchParams();
      query.set("sort", sortOption);

      if (searchTerm) {
        query.set("search", searchTerm);
      }

      if (year) {
        query.set("year", year);
      }

      const response = await fetch(
        `${WAGTAIL_BACKEND_BASE}/api/researchers/${encodeURIComponent(researcherSlug)}/sections/${encodeURIComponent(sectionSlug)}/filtered-items/?${query.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(`Filtered items request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data?.items)) {
        throw new Error("Filtered items payload is invalid");
      }

      setDisplayedResults(data.items);
    } catch (error) {
      console.error("[FilterableArchiveSection] Falling back to local filtering:", error);
      setDisplayedResults(filterResultsLocally(publications, searchTerm, sortOption, year));
    } finally {
      setIsApplyingFilters(false);
    }
  }

  function handleResetFilters() {
    setDraftSearchTerm("");
    setDraftSortOption("title_asc");
    setDraftYear("");
    setDisplayedResults(publications);
  }

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
        {isApplyingFilters ? (
          <p className="text-gray-600">Loading filtered results...</p>
        ) : displayedResults.length === 0 ? (
          <p className="text-gray-600">No items match the current filters.</p>
        ) : (
          <div className="space-y-3 w-full">
            {displayedResults.map((item, index) => (
              <SidebarItemCard
                key={`${item.title}-${item.meta_text || index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
