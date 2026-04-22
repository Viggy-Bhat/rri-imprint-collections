"use client";

import { usePathname } from "next/navigation";
import styles from "./SiteHeader.module.css";

export default function SiteHeader() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  if (pathname.startsWith("/gallery/")) {
    return null;
  }

  if (isHomePage) {
    return (
      <header className={styles.siteHeader}>
        <div className={styles.heroSection}>
          <h1 className={styles.heroTitle}>Raman Research Institute Library</h1>
          <div className={styles.heroButtonFrame}>
            <img
              src="/assets/Imprints%20Collection.png"
              alt="Imprints Collection emblem"
              className={styles.heroButton}
            />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.siteHeader}>
      <div className={styles.heroSectionCompact}>
        <img
          src="/assets/Imprints%20Collection.png"
          alt="Imprints Collection emblem"
          className={styles.heroButton}
        />
      </div>
    </header>
  );
}
