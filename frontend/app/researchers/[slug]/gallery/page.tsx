import Link from "next/link";
import { notFound } from "next/navigation";
import BentoGallery from "@/components/gallery/BentoGallery";
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
    <main className="min-h-screen bg-transparent font-sans">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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

        <BentoGallery images={galleryImages} />
      </div>
    </main>
  );
}