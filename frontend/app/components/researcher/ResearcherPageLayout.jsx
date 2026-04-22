import { ProfileCard } from "@/app/components/ProfileCard";
import { SidebarNavigation } from "@/app/components/SidebarNavigation";
import MobileSectionsSidebar from "@/components/MobileSectionsSidebar";

export function ResearcherPageLayout({
  slug,
  sidebarItems,
  researcher,
  profileImageUrl,
  profileItems,
  mobileContent,
  mobileAfterProfile,
  mobileContentBeforeProfile = false,
  showMobileProfileCard = true,
  useHashLinks = false,
  children,
}) {
  return (
    <main className="min-h-screen bg-transparent font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="hidden md:block">
          <div className="flex flex-col gap-7 lg:gap-10 lg:flex-row lg:items-start">
            <SidebarNavigation
              researcherSlug={slug}
              sidebarItems={sidebarItems}
              useHashLinks={useHashLinks}
            />

            <article className="min-w-0 flex-1 space-y-7" aria-label="Researcher content">
              {children}
            </article>

            <ProfileCard
              researcher={researcher}
              profileImageUrl={profileImageUrl}
              items={profileItems}
            />
          </div>
        </div>

        <div className="md:hidden space-y-6">
          <MobileSectionsSidebar
            researcherSlug={slug}
            sections={sidebarItems}
            useHashLinks={useHashLinks}
          />

          {mobileContentBeforeProfile ? (
            <article className="min-w-0 space-y-7" aria-label="Researcher content">
              {mobileContent ?? children}
            </article>
          ) : null}

          {showMobileProfileCard ? (
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
