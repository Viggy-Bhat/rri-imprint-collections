import Link from "next/link";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { ResearcherPageLayout } from "@/app/components/researcher/ResearcherPageLayout";
import { ResearcherContentCard } from "@/app/components/researcher/ResearcherContentCard";
import {
  getSidebarItems,
  getProfileItems,
  getResearcherPageBySlugResult,
  getResearcherProfileImageUrl,
} from "../researcherApi";

export default async function GalleryPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  const { researcher, hasError } = await getResearcherPageBySlugResult(params.slug);

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
  const sidebarItems = getSidebarItems(researcher.sidebar_items);
  const profileItems = getProfileItems(researcher.profile_items);
  const gallerySidebarItem = sidebarItems.find(
    (item) => item.slug === "gallery" || item.slug === "photo-gallery"
  );
  const galleryItems = Array.isArray(gallerySidebarItem?.gallery)
    ? gallerySidebarItem.gallery
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

      <header className="space-y-2" aria-label="Gallery page header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>
        <p className="text-red-700 font-medium">Photo Gallery</p>
      </header>

      <ResearcherContentCard title="Photo Gallery">
        {galleryItems.length === 0 ? (
          <p className="text-gray-600">No gallery available</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
            {galleryItems
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
                    {caption ? (
                      <p className="text-sm text-center mt-2 text-neutral-600">{caption}</p>
                    ) : null}
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
        )}
      </ResearcherContentCard>
    </ResearcherPageLayout>
  );
}
