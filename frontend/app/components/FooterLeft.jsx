"use client";

import { useRouter } from "next/navigation";

export function FooterLeft() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="w-10 h-10 rounded-full bg-red-700 text-white flex items-center justify-center shadow-md hover:bg-red-800 transition"
    >
      «
    </button>
  );
}
