export function SidebarItemCard({ item }) {
  if (!item?.title) {
    return null;
  }

  return (
    <article className="group rounded-xl border border-red-100 bg-amber-50/50 px-4 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-red-300 hover:bg-amber-100/40">
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-serif text-lg text-red-800 transition-colors duration-200 hover:text-red-900"
        >
          {item.title}
        </a>
      ) : (
        <h3 className="font-serif text-lg text-red-800">{item.title}</h3>
      )}

      <div className="mt-1.5 space-y-1 text-sm text-gray-600 transition-colors duration-300 group-hover:text-gray-700">
        {item.tag ? <p className="italic">{item.tag}</p> : null}
        {item.meta_text ? <p>{item.meta_text}</p> : null}
      </div>

      {item.description ? (
        <div
          className="cms-content rich-text-content mt-2 text-sm leading-6 text-gray-700"
          dangerouslySetInnerHTML={{ __html: item.description }}
        />
      ) : null}
    </article>
  );
}
