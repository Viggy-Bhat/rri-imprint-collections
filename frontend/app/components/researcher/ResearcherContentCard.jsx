function toHeadingId(title) {
  return `section-${String(title || "content")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")}`;
}

export function ResearcherContentCard({ title, children }) {
  const headingId = toHeadingId(title);

  return (
    <section aria-labelledby={headingId}>
      <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-md border border-red-100">
        <h2
          id={headingId}
          className="text-2xl sm:text-3xl font-serif font-semibold border-b border-red-300 text-red-800 pb-3"
        >
          {title}
        </h2>

        <div className="mt-5 space-y-5">{children}</div>
      </div>
    </section>
  );
}
