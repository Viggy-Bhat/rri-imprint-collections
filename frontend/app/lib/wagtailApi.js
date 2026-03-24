// Utility functions for fetching Wagtail API data
import { getWagtailBackendBaseUrl } from "@/app/lib/config";

const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();

/**
 * Fetch image details from our custom image API endpoint
 * Returns { id, title, file: { url } } structure
 */
export async function fetchImageDetails(imageId) {
  if (!imageId) return null;

  try {
    const response = await fetch(
      `${WAGTAIL_BACKEND_BASE}/api/images/${imageId}/`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      console.warn(`[fetchImageDetails] Failed to fetch image ${imageId}`);
      return null;
    }

    const imageData = await response.json();

    if (imageData?.file?.url?.startsWith("/")) {
      imageData.file.url = `${WAGTAIL_BACKEND_BASE}${imageData.file.url}`;
    }

    return imageData;
  } catch (error) {
    console.error(`[fetchImageDetails] Error fetching image ${imageId}:`, error);
    return null;
  }
}

/**
 * Batch fetch multiple images from custom image API
 */
export async function fetchImageDetailsBatch(imageIds) {
  if (!Array.isArray(imageIds)) return [];

  try {
    const promises = imageIds.map((id) => fetchImageDetails(id));
    const results = await Promise.all(promises);
    return results.filter((img) => img !== null);
  } catch (error) {
    console.error("[fetchImageDetailsBatch] Error:", error);
    return [];
  }
}
