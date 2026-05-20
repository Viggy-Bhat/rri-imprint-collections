"use client";

import { useState } from "react";

const SORT_OPTIONS = [
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
  { value: "author_asc", label: "Author A-Z" },
  { value: "author_desc", label: "Author Z-A" },
  { value: "journal_asc", label: "Journal A-Z" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export default function ArchiveFilterPanel({
  searchTerm,
  sortOption,
  year,
  onSearchTermChange,
  onSortOptionChange,
  onYearChange,
  onApplyFilters,
  onResetFilters,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="w-full lg:w-75 rounded-xl border border-[#e0d8cd] bg-[#f5efe6] p-5 shadow-sm">
      <button
        type="button"
        className="w-full md:hidden rounded-md border border-[#ccc] bg-white px-3 py-2 text-left text-sm font-medium text-[#7b2320]"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Filter Results
      </button>

      <div className={`${isOpen ? "mt-4 block" : "hidden"} md:mt-0 md:block`}>
        <h3 className="font-serif text-2xl font-semibold text-[#7b2320]">Filter</h3>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Search
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search title, author, or journal"
            className="mt-1 w-full rounded-md border border-[#ccc] px-2.5 py-2.5"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Sort By
          <select
            value={sortOption}
            onChange={(event) => onSortOptionChange(event.target.value)}
            className="mt-1 w-full rounded-md border border-[#ccc] px-2.5 py-2.5"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Year
          <input
            type="number"
            min="1800"
            max="2100"
            value={year}
            onChange={(event) => onYearChange(event.target.value)}
            placeholder="Enter year"
            className="mt-1 w-full rounded-md border border-[#ccc] px-2.5 py-2.5"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onApplyFilters}
            className="rounded-md bg-[#7b2320] px-3 py-2 text-sm font-medium text-white"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-md border border-[#ccc] bg-white px-3 py-2 text-sm font-medium text-[#7b2320]"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
