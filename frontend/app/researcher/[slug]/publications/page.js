import { redirect } from "next/navigation";
import { use } from "react";

export default function PublicationsPage({ params }) {
  const { slug } = use(params);
  redirect(`/researcher/${slug}/section/publications`);
}
