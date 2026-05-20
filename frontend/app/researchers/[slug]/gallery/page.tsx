import Link from "next/link";
import { notFound } from "next/navigation";
import ResearcherGalleryViewer from "@/components/gallery/ResearcherGalleryViewer";
import {
  getResearcherGalleryImages,
  getResearcherPageBySlugResult,
} from "@/app/researcher/[slug]/researcherApi";

type GalleryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ResearcherGalleryPage({ params }: GalleryPageProps) {
  const { slug } = await params;
  const { researcher, sectionPages, hasError } = await getResearcherPageBySlugResult(slug);

  if (hasError || !researcher) {
    notFound();
  }

  const galleryImages = await getResearcherGalleryImages(researcher, sectionPages);

  return (
    <main className="bg-[#F5F0EB] font-sans">
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-8 sm:px-6 sm:pt-6 sm:pb-10">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-red-700/80">
              Gallery
            </p>
            <h1 className="mt-2 font-serif text-4xl font-bold text-gray-900 sm:text-5xl">
              {researcher.title}
            </h1>
          </div>

          <Link
            href={`/researcher/${slug}`}
            className="text-red-700 underline underline-offset-4"
          >
            Back to Profile
          </Link>
        </div>

        <ResearcherGalleryViewer images={galleryImages} />
      </div>
    </main>
  );
}