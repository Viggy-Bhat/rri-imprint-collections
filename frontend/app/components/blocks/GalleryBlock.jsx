import { fetchImageDetailsBatch } from "@/app/lib/wagtailApi";
import { ProtectedImage } from "@/app/components/media/ProtectedImage";

/**
 * GalleryBlock - Renders image gallery
 * Fetches full image URLs from Wagtail API and renders responsive grid
 */
export async function GalleryBlock({ value }) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  // Fetch full image details for all IDs
  const images = await fetchImageDetailsBatch(value);

  if (images.length === 0) {
    return (
      <div className="my-8 p-4 bg-gray-100 rounded text-center text-gray-600">
        <p>Gallery images could not be loaded</p>
      </div>
    );
  }

  return (
    <div className="my-8">
      <h3 className="font-serif font-semibold text-lg text-red-800 mb-4">Gallery</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <GalleryImage key={image.id} image={image} />
        ))}
      </div>
    </div>
  );
}

/**
 * GalleryImage - Renders individual gallery image with protection
 * Client component for interactive features
 */
function GalleryImage({ image }) {
  if (!image) return null;

  const imageUrl = image.file?.url || image.file;
  const alt = image.title || "Gallery image";

  return (
    <div className="aspect-square overflow-hidden rounded-lg bg-gray-200 flex items-center justify-center group">
      <ProtectedImage
        src={imageUrl}
        alt={alt}
        wrapperClassName="w-full h-full"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </div>
  );
}
