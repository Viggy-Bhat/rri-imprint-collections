function SectionPlaceholderCard({ wide = false }) {
  return (
    <article className="bg-amber-50 border border-red-200 rounded p-4 space-y-2">
      <div className="skeleton h-5 rounded w-1/2" />
      <div className="skeleton h-4 rounded w-full" />
      <div className="skeleton h-4 rounded w-11/12" />
      <div className={`skeleton h-4 rounded ${wide ? "w-5/6" : "w-2/3"}`} />
    </article>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans transition-opacity duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col gap-6 lg:gap-10 lg:flex-row">
          <aside className="w-full lg:w-52 shrink-0">
            <div className="bg-white border rounded-lg p-3 space-y-3">
              <div className="skeleton h-6 w-24 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={`sidebar-skeleton-${index}`} className="skeleton h-9 w-full rounded" />
                ))}
              </div>
            </div>
          </aside>

          <article className="min-w-0 flex-1 space-y-6" aria-label="Researcher content loading">
            <div className="space-y-2">
              <div className="skeleton h-10 w-3/4 rounded" />
              <div className="skeleton h-5 w-1/3 rounded" />
            </div>

            <section className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border space-y-4">
              <div className="skeleton h-8 w-48 rounded" />
              <div className="space-y-3">
                <SectionPlaceholderCard />
                <SectionPlaceholderCard wide />
                <SectionPlaceholderCard />
              </div>
            </section>
          </article>

          <aside className="w-full lg:w-72 xl:w-80 shrink-0">
            <section className="bg-yellow-50 border p-4 rounded-lg xl:sticky xl:top-6 space-y-3">
              <div className="skeleton h-6 w-36 rounded" />
              <div className="skeleton h-44 w-full rounded-md" />
              <div className="skeleton h-7 w-2/3 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`profile-row-skeleton-${index}`} className="skeleton h-4 w-full rounded" />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
