import { ProfileCard, SidebarNavigation, MobileSectionsSidebar } from "@/components/researchers";

export function ResearcherPageLayout({
  slug,
  sidebarItems,
  researcher,
  profileImageUrl,
  profileItems,
  desktopSidebarContent,
  desktopSidebarColumnContent,
  mobileSidebarContent,
  mobileContent,
  mobileAfterProfile,
  mobileContentBeforeProfile = false,
  showDesktopProfileCard = true,
  showMobileProfileCard = true,
  useThreeColumnDesktop = false,
  useHashLinks = false,
  children,
}) {
  return (
    <main className="min-h-screen bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-6 sm:pb-8">
        <div className="hidden md:block">
          <div
            className={
              useThreeColumnDesktop
                ? "grid grid-cols-[240px_320px_minmax(0,1fr)] gap-6 items-start"
                : "flex flex-col gap-7 lg:gap-10 lg:flex-row lg:items-start"
            }
          >
            <SidebarNavigation
              researcherSlug={slug}
              sidebarItems={sidebarItems}
              useHashLinks={useHashLinks}
            />

            {useThreeColumnDesktop && (desktopSidebarColumnContent || desktopSidebarContent) ? (
              desktopSidebarColumnContent || desktopSidebarContent
            ) : null}

            <article className="min-w-0 flex-1 space-y-4" aria-label="Researcher content">
              {children}
            </article>

            {useThreeColumnDesktop ? null : desktopSidebarContent ? (
              desktopSidebarContent
            ) : showDesktopProfileCard ? (
              <ProfileCard
                researcher={researcher}
                profileImageUrl={profileImageUrl}
                items={profileItems}
              />
            ) : null}
          </div>
        </div>

        <div className="md:hidden space-y-6">
          <MobileSectionsSidebar
            researcherSlug={slug}
            sections={sidebarItems}
            useHashLinks={useHashLinks}
          />

          {mobileContentBeforeProfile ? (
            <article className="min-w-0 space-y-4" aria-label="Researcher content">
              {mobileContent ?? children}
            </article>
          ) : null}

          {mobileSidebarContent ? (
            mobileSidebarContent
          ) : showMobileProfileCard ? (
            <ProfileCard
              researcher={researcher}
              profileImageUrl={profileImageUrl}
              items={profileItems}
            />
          ) : null}

          {mobileAfterProfile ? <div>{mobileAfterProfile}</div> : null}

          {!mobileContentBeforeProfile ? (
            <article className="min-w-0 space-y-7" aria-label="Researcher content">
              {mobileContent ?? children}
            </article>
          ) : null}
        </div>
      </div>
    </main>
  );
}
