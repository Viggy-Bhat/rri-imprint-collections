"use client";

import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isResearcherPage =
    pathname.startsWith("/researcher/") || pathname.startsWith("/researchers/");

  if (pathname.startsWith("/gallery/")) {
    return null;
  }

  if (isHomePage) {
    return (
      <header className={styles.siteHeader}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>
            Raman Research Institute Library
          </h1>

          <div className={styles.imprintsBadge}>
            IMPRINTS COLLECTION
          </div>

        </div>

        <div className={styles.headerDivider} aria-hidden="true" />
      </header>
    );
  }

  return (
    <header className={styles.siteHeader}>
      <div
        className={`${styles.heroSectionCompact} ${
          isResearcherPage ? styles.heroSectionCompactWithTitle : ""
        }`}
      >
        {isResearcherPage ? (
          <h1 className={styles.heroTitle}>
            Raman Research Institute Library
          </h1>
        ) : null}

        <div className={styles.imprintsBadge}>
          IMPRINTS COLLECTION
        </div>

      </div>

      <div className={styles.headerDivider} aria-hidden="true" />
    </header>
  );
}