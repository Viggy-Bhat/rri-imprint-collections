export function SidebarItemCard({ item }) {
  if (!item?.title) {
    return null;
  }

  const titleNode = item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="font-serif text-lg text-red-800 hover:text-red-700 hover:underline"
    >
      {item.title}
    </a>
  ) : (
    <h3 className="font-serif text-lg text-red-800">{item.title}</h3>
  );

  return (
    <article className="rounded-xl border border-red-100 bg-amber-50/50 px-4 py-3 shadow-sm">
      {item.link ? titleNode : <h3 className="font-serif text-lg text-red-800">{item.title}</h3>}

      <div className="mt-1.5 space-y-1 text-sm text-gray-600">
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
