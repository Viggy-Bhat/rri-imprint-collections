import { redirect } from "next/navigation";
import { use } from "react";

export default function GuidancePage({ params }) {
  const { slug } = use(params);
  redirect(`/researcher/${slug}/section/guidance`);
}
