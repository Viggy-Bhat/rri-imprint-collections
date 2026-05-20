import { fetchImageDetails } from "@/app/lib/wagtailApi";
import { getWagtailBackendBaseUrl, getWagtailPagesApiUrl } from "@/app/lib/config";

const WAGTAIL_PAGES_API = getWagtailPagesApiUrl();
const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();

function getPageType(page) {
  return page?.meta?.type || page?.type;
}

export function getSidebarItemsFromSectionPages(sectionPages) {
  const pages = Array.isArray(sectionPages) ? sectionPages : [];

  return pages
    .map((page) => {
      const title = String(page?.title || "").trim();
      const rawSlug = String(page?.meta?.slug || page?.slug || "").trim();
      const slug = toSectionSlug(rawSlug);
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
    const response = await fetch(`${WAGTAIL_PAGES_API}?child_of=${researcherId}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `[getResearcherSectionPages] Failed (${response.status}) for child_of=${researcherId}`
      );
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
  const normalizedSlug = toSectionSlug(sectionSlug);

  if (!researcherId || !normalizedSlug) {
    return null;
  }

  const sectionPages = await getResearcherSectionPages(researcherId);
  const matchedSection = sectionPages.find(
    (page) => toSectionSlug(page?.meta?.slug || page?.slug || "") === normalizedSlug
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
    const listResponse = await fetch(
      `${WAGTAIL_PAGES_API}?type=researchers.ResearcherPage&slug=${slug}`,
      { cache: "no-store" }
    );

    if (!listResponse.ok) {
      return { researcher: null, sectionPages: [], hasError: true };
    }

    const listData = await listResponse.json();
    const matchedPage = listData?.items?.[0];

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
      };
    })
    .filter(Boolean)
    .filter((item, index, all) => {
      // Remove duplicates by slug
      return all.findIndex((entry) => entry.slug === item.slug) === index;
    });
}

function getGalleryBlocks(blocks) {
  const items = Array.isArray(blocks) ? blocks : [];

  return items.filter((block) => (block?.type || block?.block_type) === "gallery");
}

function getGalleryImageEntries(blocks) {
  return getGalleryBlocks(blocks).flatMap((block) => {
    const value = block?.value || {};
    return Array.isArray(value?.images) ? value.images : [];
  });
}

async function resolveGalleryImageEntry(entry, index = 0) {
  const value = entry?.value || entry || {};
  const imageValue = value?.image || value;

  let imageId = null;
  let imageUrl =
    imageValue?.url ||
    imageValue?.file?.url ||
    imageValue?.meta?.download_url ||
    value?.url ||
    value?.file?.url ||
    value?.meta?.download_url ||
    "";

  if (typeof imageUrl === "string" && imageUrl.startsWith("/")) {
    imageUrl = `${WAGTAIL_BACKEND_BASE}${imageUrl}`;
  }

  if (typeof imageValue === "number") {
    imageId = imageValue;
  } else if (imageValue?.id) {
    imageId = imageValue.id;
  } else if (value?.id) {
    imageId = value.id;
  }

  if (!imageUrl && imageId) {
    const imageDetails = await fetchImageDetails(imageId);
    imageUrl =
      imageDetails?.file?.url ||
      imageDetails?.url ||
      imageDetails?.meta?.download_url ||
      "";

    if (typeof imageUrl === "string" && imageUrl.startsWith("/")) {
      imageUrl = `${WAGTAIL_BACKEND_BASE}${imageUrl}`;
    }
  }

  if (!imageUrl) {
    return null;
  }

  const title = String(
    imageValue?.title || value?.title || `Gallery image ${index + 1}`
  ).trim();
  const caption = String(value?.caption || imageValue?.caption || "").trim();
  const aboutImageHtml = String(value?.about_image || imageValue?.about_image || "").trim();

  return {
    id: imageId,
    url: imageUrl,
    title,
    caption,
    aboutImageHtml,
    alt: String(value?.alt || imageValue?.alt || caption || title || `Gallery image ${index + 1}`).trim(),
  };
}

export async function getResearcherGalleryImages(researcher, sectionPages = []) {
  const galleryEntries = [];
  const sidebarItems = getSidebarItems(researcher?.sidebar_items);

  const blockGroups = [];

  sidebarItems.forEach((item) => {
    if (Array.isArray(item?.smart_content)) {
      blockGroups.push(item.smart_content);
    }
  });

  blockGroups.forEach((blocks) => {
    galleryEntries.push(...getGalleryImageEntries(blocks));
  });

  if (galleryEntries.length === 0 && researcher?.id) {
    const sectionPage = Array.isArray(sectionPages)
      ? sectionPages.find((page) => {
          const slug = toSectionSlug(page?.meta?.slug || page?.slug || "");
          const title = toSectionSlug(page?.title || "");
          return slug === "gallery" || title === "gallery";
        })
      : null;

    if (sectionPage) {
      const galleryPage = await getResearcherSectionPageBySlug(
        researcher.id,
        sectionPage.meta?.slug || sectionPage.slug || "gallery"
      );

      if (galleryPage?.smart_content) {
        galleryEntries.push(...getGalleryImageEntries(galleryPage.smart_content));
      }
    }
  }

  const normalized = await Promise.all(
    galleryEntries.map((entry, index) => resolveGalleryImageEntry(entry, index))
  );

  return normalized
    .filter(Boolean)
    .filter((image, index, all) => {
      return (
        all.findIndex(
          (entry) => entry.url === image.url || (entry.id && image.id && entry.id === image.id)
        ) === index
      );
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
    researcher.profile_image?.url ||
    researcher.profile_image?.meta?.download_url ||
    researcher.profile_image?.file ||
    researcher.profile_image?.file?.url ||
    null;

  if (typeof profileImageUrl === "string" && profileImageUrl.startsWith("/")) {
    profileImageUrl = `${WAGTAIL_BACKEND_BASE}${profileImageUrl}`;
  }

  if (!profileImageUrl && researcher.profile_image?.id) {
    const profileImage = await fetchImageDetails(researcher.profile_image.id);
    profileImageUrl = profileImage?.file?.url || null;
  }

  return profileImageUrl;
}
