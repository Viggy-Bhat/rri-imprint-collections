import { redirect } from "next/navigation";

export default async function PublicationsPage({ params: paramsPromise }) {
  const params = await paramsPromise;
  redirect(`/researcher/${params.slug}/section/publications`);
}
