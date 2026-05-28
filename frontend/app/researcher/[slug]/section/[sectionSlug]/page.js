import Link from "next/link";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { FilterableArchiveSection } from "@/app/components/FilterableArchiveSection";
import { SidebarContentPage } from "@/app/components/SidebarContentPage";
import { ResearcherPageLayout } from "@/app/components/researcher/ResearcherPageLayout";
import SmartContentRenderer from "@/components/SmartContentRenderer";
import { getWagtailBackendBaseUrl } from "@/app/lib/config";
import {
  getSidebarItems,
  getSidebarItemsFromSectionPages,
  getProfileItems,
  getResearcherPageBySlugResult,
  getResearcherProfileImageUrl,
  getResearcherSectionPageBySlug,
  toSectionSlug,
} from "../../researcherApi";

function isFilterTargetSection(sectionSlug, sectionTitle) {
  const normalizedSlug = toSectionSlug(sectionSlug);
  const normalizedTitle = toSectionSlug(sectionTitle);

  const targetSlugs = new Set([
    "publications",
    "publication",
    "research-guidance",
    "research-guidances",
    "guidance",
  ]);

  return targetSlugs.has(normalizedSlug) || targetSlugs.has(normalizedTitle);
}

function getSectionType(sectionSlug, sectionTitle) {
  const slug = toSectionSlug(sectionSlug);
  const title = toSectionSlug(sectionTitle || "");

  if (slug.includes("guidance") || title.includes("guidance")) {
    return "guidance";
  }

  if (slug.includes("news") || title.includes("news")) {
    return "news";
  }

  return "publications";
}

export default async function ResearcherSectionPage({
  params: paramsPromise,
}) {
  const params = await paramsPromise;
  const { slug, sectionSlug } = params;
  const normalizedSectionSlug = toSectionSlug(sectionSlug);
  const { researcher, sectionPages, hasError } = await getResearcherPageBySlugResult(slug);

  if (hasError) {
    return <ContentUnavailable />;
  }

  if (!researcher) {
    return (
      <main className="min-h-screen bg-transparent font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center">
          <h1 className="text-2xl font-bold text-red-600">Researcher Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Researchers
          </Link>
        </div>
      </main>
    );
  }

  const profileImageUrl = await getResearcherProfileImageUrl(researcher);
  const streamSidebarItems = getSidebarItems(researcher.sidebar_items);
  const sectionPageSidebarItems = getSidebarItemsFromSectionPages(sectionPages);
  const sidebarItems = sectionPageSidebarItems.length > 0 ? sectionPageSidebarItems : streamSidebarItems;
  const profileItems = getProfileItems(researcher.profile_items);

  const currentStreamSection = streamSidebarItems.find(
    (item) => toSectionSlug(item.slug) === normalizedSectionSlug
  );
  const sectionPage = await getResearcherSectionPageBySlug(researcher.id, normalizedSectionSlug);
  const sectionItems = Array.isArray(currentStreamSection?.items)
    ? currentStreamSection.items
    : [];

  const streamSmartContent = Array.isArray(currentStreamSection?.smart_content)
    ? currentStreamSection.smart_content
    : [];
  const sectionPageSmartContent = Array.isArray(sectionPage?.smart_content)
    ? sectionPage.smart_content
    : [];

  const sectionBlocks = (streamSmartContent.length > 0 ? streamSmartContent : sectionPageSmartContent).filter(
    (block) => {
      const type = block?.type || block?.block_type;
      return Boolean(type);
    }
  );

  const hasKnownSection = Boolean(currentStreamSection || sectionPage);

  if (!hasKnownSection) {
    return <ContentUnavailable />;
  }

  const sectionTitle =
    currentStreamSection?.title || sectionPage?.title || "Section";
  const sectionSubtitle =
    sectionPage?.subtitle || currentStreamSection?.subtitle || "";
  const shouldHideProfileCard = isFilterTargetSection(normalizedSectionSlug, sectionTitle);
  const sectionType = getSectionType(normalizedSectionSlug, sectionTitle);

  let itemCount = 0;

  if (shouldHideProfileCard) {
    const baseUrl = getWagtailBackendBaseUrl();
    const countUrl = `${baseUrl}/api/researchers/${encodeURIComponent(slug)}/sections/${encodeURIComponent(normalizedSectionSlug)}/count/`;

    try {
      const countRes = await fetch(countUrl, { next: { revalidate: 300 } });
      if (countRes.ok) {
        const countData = await countRes.json();
        itemCount = countData.total || 0;
      }
    } catch {
      itemCount = 0;
    }
  }

  const shouldRenderFilterPanel = shouldHideProfileCard && itemCount > 0;

  return (
    <ResearcherPageLayout
      slug={slug}
      sidebarItems={sidebarItems}
      researcher={researcher}
      profileImageUrl={profileImageUrl}
      profileItems={profileItems}
      showDesktopProfileCard={!shouldHideProfileCard}
      showMobileProfileCard={!shouldHideProfileCard}
    >
      <header className="space-y-2" aria-label="Section page header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>
        <p className="text-red-700 font-medium">{sectionTitle}</p>
      </header>

      {shouldRenderFilterPanel ? (
        <FilterableArchiveSection
          researcherSlug={slug}
          sectionType={sectionType}
        />
      ) : sectionBlocks.length > 0 ? (
        <section className="rounded-2xl border border-red-100 bg-white/95 px-5 py-5 sm:px-7 sm:py-6 shadow-md">
          {sectionSubtitle ? <p className="text-gray-600 mb-4">{sectionSubtitle}</p> : null}
          <SmartContentRenderer blocks={sectionBlocks} galleryHref={`/researchers/${slug}/gallery`} />
        </section>
      ) : (
        <SidebarContentPage
          title={sectionTitle}
          subtitle={sectionSubtitle}
          items={sectionItems}
        />
      )}
    </ResearcherPageLayout>
  );
}
