import { SidebarItemCard } from "@/app/components/SidebarItemCard";

export function SidebarContentPage({ title, subtitle, items = [] }) {
  const normalizedItems = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-2xl border border-red-100 bg-white/95 px-5 py-5 sm:px-7 sm:py-6 shadow-md">
      <header className="text-center">
        <h2 className="font-serif text-3xl font-semibold text-red-800">{title}</h2>
        <div className="mx-auto mt-3 h-px w-28 bg-red-500" />
        {subtitle ? <p className="mt-3 text-gray-600">{subtitle}</p> : null}
      </header>

      {normalizedItems.length === 0 ? (
        <p className="mt-6 text-gray-600">No items available.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {normalizedItems.map((item, index) => (
            <SidebarItemCard
              key={`${item.title}-${item.meta_text || index}`}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}
