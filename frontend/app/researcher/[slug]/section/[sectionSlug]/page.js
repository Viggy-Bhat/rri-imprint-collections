import Link from "next/link";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { FilterableArchiveSection } from "@/app/components/FilterableArchiveSection";
import { SidebarContentPage } from "@/app/components/SidebarContentPage";
import { ResearcherPageLayout } from "@/app/components/researcher/ResearcherPageLayout";
import SmartContentRenderer from "@/components/SmartContentRenderer";
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

function getFilterItemsFromBlocks(blocks) {
  const source = Array.isArray(blocks) ? blocks : [];

  return source
    .map((block) => {
      const type = block?.type || block?.block_type;
      const value = block?.value || {};

      if (type === "publication") {
        const title = String(value?.title || "").trim();
        if (!title) {
          return null;
        }

        const journal = String(value?.journal || "").trim();
        const year = String(value?.year || "").trim();
        const link = String(value?.link || "").trim();

        return {
          title,
          link,
          tag: journal ? `Journal: ${journal}` : "",
          meta_text: year ? `Year: ${year}` : "",
          journal,
          year,
        };
      }

      if (type === "guidance") {
        const title = String(value?.thesis_title || value?.title || "").trim();
        if (!title) {
          return null;
        }

        const author = String(value?.student_name || "").trim();
        const year = String(value?.year || "").trim();
        const link = String(value?.link || "").trim();
        const description = String(value?.description || "").trim();

        return {
          title,
          link,
          tag: author ? `Author: ${author}` : "",
          meta_text: year ? `Year: ${year}` : "",
          description,
          author,
          year,
        };
      }

      return null;
    })
    .filter(Boolean);
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
  const fallbackFilterItems = getFilterItemsFromBlocks(sectionBlocks);
  const filterItems = sectionItems.length > 0 ? sectionItems : fallbackFilterItems;
  const shouldRenderFilterPanel = shouldHideProfileCard && filterItems.length > 0;

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
          items={filterItems}
          researcherSlug={slug}
          sectionSlug={normalizedSectionSlug}
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
