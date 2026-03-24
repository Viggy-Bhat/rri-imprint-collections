import { fetchImageDetails } from "@/app/lib/wagtailApi";
import { getWagtailPagesApiUrl } from "@/app/lib/config";

const WAGTAIL_PAGES_API = getWagtailPagesApiUrl();

function getPageType(page) {
  return page?.meta?.type || page?.type;
}

export function getSidebarItemsFromSectionPages(sectionPages) {
  const pages = Array.isArray(sectionPages) ? sectionPages : [];

  return pages
    .map((page) => {
      const title = String(page?.title || "").trim();
      const slug = String(page?.meta?.slug || page?.slug || "").trim();
      const subtitle = String(page?.subtitle || "").trim();

      if (!title || !slug) {
        return null;
      }

      return {
        title,
        slug,
        subtitle,
      };
    })
    .filter(Boolean);
}

export async function getResearcherSectionPages(researcherId) {
  if (!researcherId) {
    return [];
  }

  try {
    const response = await fetch(
      `${WAGTAIL_PAGES_API}?child_of=${researcherId}&limit=200`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    return items.filter((page) => getPageType(page) === "researchers.ResearcherSectionPage");
  } catch (error) {
    console.error("[getResearcherSectionPages] Error:", error);
    return [];
  }
}

export async function getResearcherSectionPageBySlug(researcherId, sectionSlug) {
  const normalizedSlug = String(sectionSlug || "").trim();

  if (!researcherId || !normalizedSlug) {
    return null;
  }

  const sectionPages = await getResearcherSectionPages(researcherId);
  const matchedSection = sectionPages.find(
    (page) => String(page?.meta?.slug || page?.slug || "").trim() === normalizedSlug
  );

  if (!matchedSection?.id) {
    return null;
  }

  try {
    const response = await fetch(`${WAGTAIL_PAGES_API}${matchedSection.id}/`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[getResearcherSectionPageBySlug] Error:", error);
    return null;
  }
}

export async function getResearcherPageBySlugResult(slug) {
  try {
    const listResponse = await fetch(WAGTAIL_PAGES_API, { cache: "no-store" });

    if (!listResponse.ok) {
      return { researcher: null, sectionPages: [], hasError: true };
    }

    const listData = await listResponse.json();
    const pages = Array.isArray(listData?.items) ? listData.items : [];

    const researcherPages = pages.filter(
      (page) => page?.meta?.type === "researchers.ResearcherPage"
    );

    const matchedPage = researcherPages.find((page) => page?.meta?.slug === slug);

    if (!matchedPage?.id) {
      return { researcher: null, sectionPages: [], hasError: false };
    }

    const detailResponse = await fetch(
      `${WAGTAIL_PAGES_API}${matchedPage.id}/`,
      { cache: "no-store" }
    );

    if (!detailResponse.ok) {
      return { researcher: null, sectionPages: [], hasError: true };
    }

    const researcher = await detailResponse.json();
    const sectionPages = await getResearcherSectionPages(matchedPage.id);

    return { researcher, sectionPages, hasError: false };
  } catch (error) {
    console.error("[getResearcherPageBySlugResult] Error:", error);
    return { researcher: null, sectionPages: [], hasError: true };
  }
}

export async function getResearcherPageBySlug(slug) {
  const { researcher } = await getResearcherPageBySlugResult(slug);
  return researcher;
}

export function normalizeContentBlocks(content) {
  const blocks = Array.isArray(content) ? content : [];

  return blocks.map((block) => ({
    ...block,
    type: block?.type || block?.block_type,
  }));
}

export function toSectionSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function getSections(content) {
  const blocks = normalizeContentBlocks(content);

  return blocks
    .filter((block) => block.type === "section")
    .map((block) => {
      const title = String(block?.value?.title || "").trim();
      const slugFromContent = String(block?.value?.slug || "").trim();
      const slug = toSectionSlug(slugFromContent || title);

      if (!title || !slug) {
        return null;
      }

      return {
        ...block,
        value: {
          ...block.value,
          title,
          slug,
        },
      };
    })
    .filter(Boolean);
}

export function getSidebarItems(sidebarItems) {
  const blocks = Array.isArray(sidebarItems) ? sidebarItems : [];

  return blocks
    .map((block) => {
      // Handle both direct values and wrapped blocks
      const value = block?.value || block || {};
      const blockType = block?.type || block?.block_type || "";
      
      // Only process if this looks like a sidebar item
      if (!blockType.includes("sidebar") && blockType !== "" && !value.title && !value.slug) {
        return null;
      }
      
      const title = String(value?.title || "").trim();
      const subtitle = String(value?.subtitle || "").trim();
      const slug = toSectionSlug(value?.slug || title);
      
      if (!title || !slug) {
        return null;
      }
      
      const rawItems = Array.isArray(value?.items) ? value.items : [];
      const smartContent = Array.isArray(value?.smart_content) ? value.smart_content : [];
      const gallery = Array.isArray(value?.gallery) ? value.gallery : [];

      const items = rawItems
        .map((item) => {
          const itemValue = item?.value || item || {};

          const itemTitle = String(itemValue?.title || "").trim();
          const link = String(itemValue?.link || "").trim();
          const tag = String(itemValue?.tag || "").trim();
          const metaText = String(itemValue?.meta_text || "").trim();
          const description = String(itemValue?.description || "").trim();

          if (!itemTitle) {
            return null;
          }

          return {
            title: itemTitle,
            link,
            tag,
            meta_text: metaText,
            description,
          };
        })
        .filter(Boolean);

      return {
        title,
        subtitle,
        slug,
        items,
        smart_content: smartContent,
        gallery: gallery,
      };
    })
    .filter(Boolean)
    .filter((item, index, all) => {
      // Remove duplicates by slug
      return all.findIndex((entry) => entry.slug === item.slug) === index;
    });
}

export function getBiographySections(bioSections) {
  const blocks = Array.isArray(bioSections) ? bioSections : [];

  return blocks
    .filter((block) => (block?.type || block?.block_type) === "bio_section")
    .map((block) => {
      const value = block?.value || {};
      const title = String(value?.title || "").trim();
      const content = String(value?.content || "").trim();
      const slug = toSectionSlug(title);

      if (!title || !content) {
        return null;
      }

      return {
        title,
        content,
        slug,
      };
    })
    .filter(Boolean);
}

export function getProfileItems(profileItems, limit = 20) {
  const blocks = Array.isArray(profileItems) ? profileItems : [];

  return blocks
    .map((block) => {
      const value = block?.value || {};
      const label = String(value?.label || "").trim();
      const itemValue = String(value?.value || value?.content || "").trim();

      if (!label || !itemValue) {
        return null;
      }

      return {
        label,
        value: itemValue,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

export async function getResearcherProfileImageUrl(researcher) {
  if (!researcher) {
    return null;
  }

  let profileImageUrl =
    researcher.profile_image?.meta?.download_url || researcher.profile_image?.file || null;

  if (!profileImageUrl && researcher.profile_image?.id) {
    const profileImage = await fetchImageDetails(researcher.profile_image.id);
    profileImageUrl = profileImage?.file?.url || null;
  }

  return profileImageUrl;
}
