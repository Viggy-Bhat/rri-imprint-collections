export function BiographySections({ sections = [] }) {
  const items = Array.isArray(sections) ? sections : [];

  if (items.length === 0) {
    return <p className="text-gray-600">No biography sections available.</p>;
  }

  return (
    <div className="space-y-6">
      {items.map((section) => (
        <section
          key={section.slug}
          className="bg-white border border-red-100 rounded-2xl shadow-md overflow-hidden"
        >
          <header className="bg-amber-50 px-5 sm:px-7 py-4 border-b border-red-200 text-center">
            <h2 className="text-2xl font-serif font-semibold text-red-800">{section.title}</h2>
            <div className="w-24 h-0.5 bg-red-500 mx-auto mt-3" />
          </header>

          <div
            className="cms-content rich-text-content px-5 sm:px-7 py-5 prose max-w-none text-gray-900 prose-p:leading-7 prose-a:text-red-700 prose-a:underline"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        </section>
      ))}
    </div>
  );
}
