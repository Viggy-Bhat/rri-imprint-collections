import { ResearcherSearchList } from "@/components/ResearcherSearchList";
import { ContentUnavailable } from "@/components/ContentUnavailable";
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
  <main className="bg-transparent font-sans">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 sm:pb-4">  {/* ← removed pt, add pt-0 */}
      <header className="archives-section text-center mb-5 sm:mb-6">
        <div className="mt-1 sm:mt-2 space-y-2 sm:space-y-2.5">  {/* ← mt-3/mt-4 → mt-1/mt-2 */}
          <h3 className="text-3xl sm:text-5xl font-serif italic font-semibold tracking-tight text-red-800">
            From the Archives...
          </h3>
          <p className="text-xl sm:text-[3.1rem] font-serif italic text-red-800 leading-snug max-w-4xl mx-auto">
            A curated collage of profiles and publications of RRIians,
            whose imprints on the sands of time have been culled and collated for posterity
            by the library staff of RRI.
          </p>
        </div>
      </header>
      

        <section className="bg-white/95 p-5 sm:p-7 rounded-2xl shadow-md border border-red-100">
          <h2 className="text-2xl sm:text-3xl font-serif font-semibold border-b border-red-300 text-red-800 pb-3 mb-6">
            Profiles
          </h2>

          {sortedResearchers.length === 0 ? (
            <p className="text-gray-600">No Profiles pages found.</p>
          ) : (
            <ResearcherSearchList
              researchers={sortedResearchers}
              labels={{
                search: "Search Profiles",
                countSuffix: "Profiles",
                noMatches: "No Profiles match your search.",
              }}
            />
          )}
        </section>
      </div>
    </main>
  );
}
