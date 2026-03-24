import { ResearcherSearchList } from "@/app/components/ResearcherSearchList";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { getWagtailPagesApiUrl } from "@/app/lib/config";

const WAGTAIL_PAGES_API = getWagtailPagesApiUrl();

async function getResearchers() {
  try {
    const response = await fetch(WAGTAIL_PAGES_API, { cache: "no-store" });

    if (!response.ok) {
      return { researchers: [], hasError: true };
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    const researchers = items.filter(
      (page) => page?.meta?.type === "researchers.ResearcherPage"
    );
    return { researchers, hasError: false };
  } catch {
    return { researchers: [], hasError: true };
  }
}

export default async function Home() {
  const { researchers, hasError } = await getResearchers();

  if (hasError) {
    return <ContentUnavailable />;
  }

  const sortedResearchers = [...researchers].sort((left, right) =>
    (left?.title || "").localeCompare(right?.title || "")
  );

  return (
    <main className="min-h-screen bg-amber-50/30 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="text-center mb-10 sm:mb-12 space-y-3">
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold tracking-tight text-red-800">
            Imprints Collection
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            A numbered archive of researchers and their contributions
          </p>
        </header>

        <section className="bg-white/95 p-5 sm:p-7 rounded-2xl shadow-md border border-red-100">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold border-b border-red-300 text-red-800 pb-3 mb-6">
            Researchers
          </h2>

          {sortedResearchers.length === 0 ? (
            <p className="text-gray-600">No researcher pages found.</p>
          ) : (
            <ResearcherSearchList researchers={sortedResearchers} />
          )}
        </section>
      </div>
    </main>
  );
}
