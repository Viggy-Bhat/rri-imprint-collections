/**
 * PublicationBlock - Renders publication metadata with optional link
 */
export function PublicationBlock({ value }) {
  if (!value) return null;

  const { title, year, journal, link } = value;

  return (
    <div className="my-4 p-4 border border-red-200 bg-amber-50 rounded">
      <h3 className="font-serif font-semibold text-lg text-red-800 mb-2">{title || "Publication"}</h3>

      <div className="space-y-1 text-sm text-gray-800">
        {journal && <p><span className="font-semibold">Journal:</span> {journal}</p>}
        {year && <p><span className="font-semibold">Year:</span> {year}</p>}
      </div>

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition text-sm font-medium"
        >
          📎 Read Publication
        </a>
      )}
    </div>
  );
}
