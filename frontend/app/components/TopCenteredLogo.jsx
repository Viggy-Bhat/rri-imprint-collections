"use client";

import { usePathname } from "next/navigation";

export function TopCenteredLogo() {
  const pathname = usePathname();

  // Home page uses its own placement under the main heading.
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="mx-auto w-full px-4 pt-5 sm:px-6 sm:pt-7">
      <div className="flex justify-center">
        <img
          src="/assets/background/Imprints%20Collection%20emblem%20design.png"
          alt="Imprints Collection emblem"
          className="h-auto w-28 sm:w-36 lg:w-44"
        />
      </div>
    </div>
  );
}
