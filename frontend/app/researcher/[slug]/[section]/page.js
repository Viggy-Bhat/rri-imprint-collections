import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
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
} from "../researcherApi";

export default async function DynamicSectionPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { section } = params;
  const { researcher, sectionPages, hasError } = await getResearcherPageBySlugResult(params.slug);

  if (hasError) {
    return <ContentUnavailable />;
  }

  if (!researcher) {
    return (
      <main className="min-h-screen bg-gray-50 font-sans">
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
  const isChildSectionMode = sectionPageSidebarItems.length > 0;
  const sidebarItems =
    isChildSectionMode
      ? sectionPageSidebarItems
      : streamSidebarItems;
  const profileItems = getProfileItems(researcher.profile_items);

  const currentSection = sidebarItems.find((item) => toSectionSlug(item.slug) === section);
  const currentStreamSection = streamSidebarItems.find((item) => toSectionSlug(item.slug) === section);
  const sectionPage = await getResearcherSectionPageBySlug(researcher.id, section);

  if (!currentSection && !currentStreamSection && !sectionPage) {
    notFound();
  }

  const sectionTitle =
    currentSection?.title || currentStreamSection?.title || sectionPage?.title || "Section";
  const sectionSubtitle =
    sectionPage?.subtitle || currentSection?.subtitle || currentStreamSection?.subtitle || "";

  const streamSmartContent = Array.isArray(currentStreamSection?.smart_content)
    ? currentStreamSection.smart_content
    : [];
  const sectionPageSmartContent = Array.isArray(sectionPage?.smart_content)
    ? sectionPage.smart_content
    : [];
  const smartContent = streamSmartContent.length > 0 ? streamSmartContent : sectionPageSmartContent;

  const gallery = Array.isArray(currentStreamSection?.gallery)
    ? currentStreamSection.gallery
    : [];
  const items = Array.isArray(currentStreamSection?.items)
    ? currentStreamSection.items
    : [];

  return (
    <ResearcherPageLayout
      slug={params.slug}
      sidebarItems={sidebarItems}
      researcher={researcher}
      profileImageUrl={profileImageUrl}
      profileItems={profileItems}
    >
      <Breadcrumb researcherTitle={researcher.title} slug={params.slug} />

      <header className="space-y-2" aria-label="Section page header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>
        <p className="text-red-700 font-medium">{sectionTitle}</p>
      </header>

      <section className="rounded-2xl border border-red-100 bg-white/95 px-5 py-5 sm:px-7 sm:py-6 shadow-md">
        {sectionSubtitle ? <p className="text-gray-600 mb-4">{sectionSubtitle}</p> : null}

        {/* Step 3: Render smart content properly */}
        {smartContent.length > 0 && (
          <SmartContentRenderer blocks={smartContent} />
        )}

        {/* Step 4: Render gallery images */}
        {gallery.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {gallery
              .map((item, index) => {
                const image = item?.image || item?.value?.image || null;
                const caption = item?.caption || item?.value?.caption || "";
                const imageUrl = image?.url || image?.meta?.download_url || "";

                if (!imageUrl) {
                  return null;
                }

                return (
                  <div key={index} className="rounded-lg overflow-hidden shadow">
                    <img
                      src={imageUrl}
                      alt={caption || "Gallery image"}
                      className="w-full object-cover"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />

                    {caption && (
                      <p className="text-sm text-center mt-2 text-neutral-600">
                        {caption}
                      </p>
                    )}
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        )}

        {/* Step 5: Restore legacy item rendering */}
        {smartContent.length === 0 && items.length > 0 && (
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="card-academic p-6">
                <h3 className="text-xl font-semibold text-[#8b1c1c]">
                  {item.title}
                </h3>

                {item.tag && <p className="text-sm text-neutral-500">{item.tag}</p>}

                {item.meta_text && (
                  <p className="text-sm text-neutral-600">{item.meta_text}</p>
                )}

                {item.description && (
                  <div
                    className="cms-content"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b1c1c] underline"
                  >
                    View resource
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 6: Add fallback message */}
        {smartContent.length === 0 &&
          gallery.length === 0 &&
          items.length === 0 && (
          <p className="text-neutral-500">
            No items available.
          </p>
        )}
      </section>
    </ResearcherPageLayout>
  );
}
