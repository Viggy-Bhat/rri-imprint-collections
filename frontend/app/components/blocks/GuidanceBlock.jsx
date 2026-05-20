/**
 * GuidanceBlock - Renders guidance title and description
 */
export function GuidanceBlock({ value }) {
  if (!value) return null;

  const { title, description, link } = value;

  return (
    <div className="my-4 p-4 bg-amber-50 rounded border border-red-200">
      {title && <h3 className="font-serif font-semibold text-red-800 mb-2">{title}</h3>}
      {description && (
        <div
          className="cms-content rich-text-content text-gray-800 leading-7"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-red-800 underline underline-offset-4"
        >
          Open Link
          <span aria-hidden="true">→</span>
        </a>
      )}
    </div>
  );
}
