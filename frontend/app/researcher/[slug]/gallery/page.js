import { redirect } from "next/navigation";

export default async function GalleryPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  redirect(`/researcher/${params.slug}/section/gallery`);
}
