import Link from "next/link";
import { BiographySections } from "@/app/components/BiographySections";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { ResearcherPageLayout } from "@/app/components/researcher/ResearcherPageLayout";
import { formatIndianDateRange } from "@/app/lib/formatDate";
import {
  getBiographySections,
  getProfileItems,
  getResearcherPageBySlugResult,
  getResearcherProfileImageUrl,
  getSidebarItems,
} from "./researcherApi";

function buildSidebarSections(sidebarItems) {
  const items = Array.isArray(sidebarItems) ? sidebarItems : [];

  return items
    .map((item) => {
      if (!item?.title || !item?.slug) {
        return null;
      }

      return {
        title: item.title,
        slug: item.slug,
        subtitle: item.subtitle,
      };
    })
    .filter(Boolean);
}




export default async function ResearcherPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { researcher, hasError } = await getResearcherPageBySlugResult(params.slug);

  if (hasError) {
    return <ContentUnavailable />;
  }

  if (!researcher) {
    return (
      <main className="min-h-screen bg-transparent font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
          <h1 className="text-2xl font-bold text-red-600">Researcher Not Found</h1>
          <p className="text-gray-600 mt-2">The researcher you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Researchers
          </Link>
        </div>
      </main>
    );
  }

  const profileImageUrl = await getResearcherProfileImageUrl(researcher);

  const dateText = formatIndianDateRange(researcher.birth_date, researcher.death_date) || null;

  const sidebarItems = getSidebarItems(researcher.sidebar_items);
  const sidebarSections = buildSidebarSections(sidebarItems);
  const biographySections = getBiographySections(researcher.bio_sections);
  const profileItems = getProfileItems(researcher.profile_items);

  const desktopContent = (
    <>
      <header className="space-y-2" aria-label="Researcher overview header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>

        {researcher.field && (
          <p className="text-red-700 font-medium">{researcher.field}</p>
        )}

        {dateText && <p className="text-gray-500 text-sm sm:text-base">{dateText}</p>}
      </header>

      <BiographySections sections={biographySections} />
    </>
  );

  const mobileContent = (
    <>
      <header className="space-y-2" aria-label="Researcher overview header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>

        {researcher.field && (
          <p className="text-red-700 font-medium">{researcher.field}</p>
        )}

        {dateText && <p className="text-gray-500 text-sm sm:text-base">{dateText}</p>}
      </header>
    </>
  );

  return (
    <ResearcherPageLayout
      slug={params.slug}
      sidebarItems={sidebarSections}
      researcher={researcher}
      profileImageUrl={profileImageUrl}
      profileItems={profileItems}
      mobileContent={mobileContent}
      mobileContentBeforeProfile
      mobileAfterProfile={<BiographySections sections={biographySections} />}
    >
      {desktopContent}
    </ResearcherPageLayout>
  );
}
