import { redirect } from "next/navigation";

export default async function LegacySectionRoute({ params: paramsPromise }) {
  const params = await paramsPromise;
  redirect(`/researcher/${params.slug}/section/${params.section}`);
}
