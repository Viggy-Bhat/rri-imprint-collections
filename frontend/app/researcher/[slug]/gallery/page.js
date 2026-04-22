import { redirect } from "next/navigation";

export default async function LegacyResearcherGalleryPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  redirect(`/researcher/${params.slug}/section/gallery`);
}
