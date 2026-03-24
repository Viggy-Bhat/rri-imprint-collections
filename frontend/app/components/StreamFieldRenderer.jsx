import { BioBlock } from "./blocks/BioBlock";
import { PublicationBlock } from "./blocks/PublicationBlock";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { GuidanceBlock } from "./blocks/GuidanceBlock";

export function FlexibleSectionRenderer({ section }) {
  const value = section?.value || section;

  if (!value || typeof value !== "object") {
    return null;
  }

  const title = String(value?.title || "").trim();
  const content = String(value?.content || "").trim();
  const images = Array.isArray(value?.images) ? value.images : [];
  const items = Array.isArray(value?.items) ? value.items : [];
  const explicitType = String(value?.type || "").trim().toLowerCase();

  const sectionType =
    explicitType === "gallery" || explicitType === "list" || explicitType === "text"
      ? explicitType
      : images.length > 0
        ? "gallery"
        : items.length > 0
          ? "list"
          : "text";

  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-2xl font-serif font-semibold border-b border-red-300 text-red-800 pb-3">
          {title}
        </h2>
      )}

      {sectionType === "text" && content ? (
        <div
          className="cms-content rich-text-content prose max-w-none text-gray-900 prose-p:leading-7 prose-a:text-red-700 prose-a:underline"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : null}

      {sectionType === "list" && items.length > 0 && (
        <div className="space-y-3.5" aria-label="Section items">
          {items.map((item, index) => (
            <article key={`${item?.title || "item"}-${index}`} className="p-5 bg-amber-50/80 border border-red-200 rounded-xl shadow-sm">
              {item?.title && <h4 className="font-serif text-lg font-semibold text-red-800 mb-2">{item.title}</h4>}
              {item?.description && (
                <div
                  className="cms-content rich-text-content text-gray-800 leading-7"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              )}
            </article>
          ))}
        </div>
      )}

      {sectionType === "gallery" && images.length > 0 && (
        <div aria-label="Section images">
          <GalleryBlock value={images} />
        </div>
      )}

      {sectionType === "text" && !content && (
        <p className="text-gray-500">No text content available.</p>
      )}

      {sectionType === "list" && items.length === 0 && (
        <p className="text-gray-500">No list items available.</p>
      )}

      {sectionType === "gallery" && images.length === 0 && (
        <p className="text-gray-500">No gallery images available.</p>
      )}
    </section>
  );
}

/**
 * StreamFieldRenderer - Dynamically renders Wagtail StreamField blocks
 * Handles: bio (richtext), publication (struct), gallery (images), guidance
 */

export function BlockRenderer({ block }) {
  if (!block) return null;

  const type = block?.type || block?.block_type;
  const { value } = block;

  switch (type) {
    case "bio":
      return <BioBlock value={value} />;
    case "publication":
      return <PublicationBlock value={value} />;
    case "gallery":
      return <GalleryBlock value={value} />;
    case "guidance":
      return <GuidanceBlock value={value} />;
    case "section":
      return <FlexibleSectionRenderer section={block} />;
    default:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-600">Unknown block type: {type}</p>
        </div>
      );
  }
}
/**
 * StreamFieldRenderer - Wrapper component for rendering all blocks
 */
export function StreamFieldRenderer({ content, blocks }) {
  const streamBlocks = Array.isArray(content)
    ? content
    : Array.isArray(blocks)
      ? blocks
      : [];

  if (streamBlocks.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No content available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {streamBlocks.map((block, index) => (
        <BlockRenderer key={block?.id || index} block={block} />
      ))}
    </div>
  );
}
