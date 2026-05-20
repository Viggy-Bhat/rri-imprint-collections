"use client";

import { useState } from "react";

const SORT_OPTIONS = [
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "title_desc", label: "Title (Z-A)" },
  { value: "author_asc", label: "Author Name (A-Z)" },
  { value: "author_desc", label: "Author Name (Z-A)" },
  { value: "journal_asc", label: "Journal Name" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export default function FilterPanel({
  searchTerm,
  sortOption,
  fromYear,
  toYear,
  filteredCount,
  totalCount,
  onSearchTermChange,
  onSortOptionChange,
  onFromYearChange,
  onToYearChange,
  onApplyFilters,
  onResetFilters,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="w-full rounded-[12px] bg-[#f4eee6] p-5 shadow-sm">
      <button
        type="button"
        className="md:hidden w-full rounded-md border border-[#c9b9a7] bg-white px-3 py-2 text-left text-sm font-semibold text-[#7b2320]"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        Filter Results
      </button>

      <div className={`${isOpen ? "mt-4 block" : "hidden"} md:mt-0 md:block`}>
        <h3 className="font-serif text-2xl font-semibold text-[#7b2320]">Filter Publications</h3>
        <p className="mt-1 text-xs text-gray-600">Showing {filteredCount} of {totalCount}</p>

        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Search Author or Journal
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search by title, author, or journal"
              className="mt-1 w-full rounded-md border border-[#ccc] px-[10px] py-[10px] text-sm outline-none focus:border-[#b38b6d] focus:ring-2 focus:ring-[#e5d8ca]"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Sort By
            <select
              value={sortOption}
              onChange={(event) => onSortOptionChange(event.target.value)}
              className="mt-1 w-full rounded-md border border-[#ccc] px-[10px] py-[10px] text-sm outline-none focus:border-[#b38b6d] focus:ring-2 focus:ring-[#e5d8ca]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-sm font-medium text-gray-700">Filter By Year</p>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <input
                type="number"
                min="1800"
                max="2100"
                value={fromYear}
                onChange={(event) => onFromYearChange(event.target.value)}
                placeholder="From"
                className="w-full rounded-md border border-[#ccc] px-[10px] py-[10px] text-sm outline-none focus:border-[#b38b6d] focus:ring-2 focus:ring-[#e5d8ca]"
              />
              <input
                type="number"
                min="1800"
                max="2100"
                value={toYear}
                onChange={(event) => onToYearChange(event.target.value)}
                placeholder="To"
                className="w-full rounded-md border border-[#ccc] px-[10px] py-[10px] text-sm outline-none focus:border-[#b38b6d] focus:ring-2 focus:ring-[#e5d8ca]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onApplyFilters}
              className="rounded-md bg-[#7b2320] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#5f1b19]"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-md border border-[#c9b9a7] bg-white px-3 py-2 text-sm font-medium text-[#7b2320] transition hover:bg-[#efe4d8]"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
