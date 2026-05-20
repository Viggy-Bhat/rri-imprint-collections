import { redirect } from "next/navigation";
import { use } from "react";

export default function LegacySectionRoute({ params }) {
  const { slug, section } = use(params);
  redirect(`/researcher/${slug}/section/${section}`);
}
