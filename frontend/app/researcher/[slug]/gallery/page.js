import { redirect } from "next/navigation";
import { use } from "react";

export default function LegacyResearcherGalleryPage({ params }) {
  const { slug } = use(params);
  redirect(`/researchers/${slug}/gallery`);
}
