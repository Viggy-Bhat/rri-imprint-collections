"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import GalleryCarousel from "./GalleryCarousel";

export type GalleryImage = {
  id?: number | null;
  url: string;
  title: string;
  caption?: string;
  aboutImageHtml?: string;
  alt: string;
};

type BentoGalleryProps = {
  images: GalleryImage[];
};

function getTileClasses(index: number) {
  const pattern = index % 6;

  if (pattern === 0) return "md:col-span-2 md:row-span-2";
  if (pattern === 3) return "md:row-span-2";
  if (pattern === 4) return "md:col-span-2";
  return "md:col-span-1 md:row-span-1";
}

function shouldDisableOptimization(url: string) {
  const value = String(url || "").trim();

  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  } catch {
    return false;
  }
}

export default function BentoGallery({ images }: BentoGalleryProps) {
  const normalizedImages = useMemo(
    () => (Array.isArray(images) ? images : []),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (normalizedImages.length === 0) {
    return <p className="text-sm text-gray-600">No gallery images available.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[220px]">
        {normalizedImages.map((image, index) => (
          <button
            key={`${image.id || image.url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`group relative h-65 overflow-hidden rounded-2xl border border-red-100 bg-neutral-100 shadow-sm transition-transform duration-300 hover:scale-[1.02] md:h-full ${getTileClasses(index)}`}
            aria-label={`Open gallery image ${index + 1}`}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              unoptimized={shouldDisableOptimization(image.url)}
              onContextMenu={(event) => event.preventDefault()}
              draggable={false}
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-4 py-4 text-white">
              <p className="text-sm font-medium">{image.caption || image.title}</p>
            </div>
          </button>
        ))}
      </div>

      <GalleryCarousel
        images={normalizedImages}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onChange={setActiveIndex}
      />
    </>
  );
}