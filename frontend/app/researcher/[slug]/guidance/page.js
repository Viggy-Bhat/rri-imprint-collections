import Link from "next/link";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { ContentUnavailable } from "@/app/components/ContentUnavailable";
import { ResearcherPageLayout } from "@/app/components/researcher/ResearcherPageLayout";
import { ResearcherContentCard } from "@/app/components/researcher/ResearcherContentCard";
import SmartContentRenderer from "@/components/SmartContentRenderer";
import {
  getSidebarItems,
  getProfileItems,
  getResearcherPageBySlugResult,
  getResearcherProfileImageUrl,
} from "../researcherApi";

export default async function GuidancePage({ params: paramsPromise }) {
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
  const guidanceSidebarItem = sidebarItems.find(
    (item) => item.slug === "guidance" || item.slug === "research-guidance"
  );
  const smartContent = Array.isArray(guidanceSidebarItem?.smart_content)
    ? guidanceSidebarItem.smart_content
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

      <header className="space-y-2" aria-label="Guidance page header">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900">{researcher.title}</h1>
        <p className="text-red-700 font-medium">Research Guidance</p>
      </header>

      <ResearcherContentCard title="Research Guidance">
        {smartContent.length === 0 ? (
          <p className="text-gray-600">No guidance available</p>
        ) : (
          <SmartContentRenderer blocks={smartContent} />
        )}
      </ResearcherContentCard>
    </ResearcherPageLayout>
  );
}
