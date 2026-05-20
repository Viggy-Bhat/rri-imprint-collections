function HomeListSkeletonItem() {
  return (
    <li className="list-none">
      <div className="skeleton h-5 w-full rounded-md" />
    </li>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-transparent font-sans transition-opacity duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="text-center mb-8 sm:mb-10 space-y-3">
          <div className="skeleton h-10 w-72 mx-auto rounded" />
          <div className="skeleton h-5 w-80 max-w-full mx-auto rounded" />
        </header>

        <section className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border space-y-4">
          <div className="skeleton h-8 w-44 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-36 rounded" />
            <div className="skeleton h-10 w-full rounded-md" />
          </div>

          <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <HomeListSkeletonItem key={`home-skeleton-item-${index}`} />
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
