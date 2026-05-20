"use client";

import { useState } from "react";
import Image from "next/image";
import GalleryCarousel from "./GalleryCarousel";

function shouldDisableOptimization(url) {
  const value = String(url || "").trim();
  if (!value) return false;
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

export default function ResearcherGalleryViewer({ images }) {
  const normalizedImages = Array.isArray(images) ? images : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (normalizedImages.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-[#efe9dc]">
        <p className="text-sm text-neutral-600">No gallery images available.</p>
      </div>
    );
  }

  const selectedImage = normalizedImages[selectedIndex];

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
        {/* LEFT COLUMN — Main Image Viewer */}
        <div
          className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-lg bg-[#efe9dc] lg:aspect-auto lg:h-[380px] lg:flex-[7]"
          onClick={() => setLightboxIndex(selectedIndex)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              setLightboxIndex(selectedIndex);
            }
          }}
          aria-label="Open image in carousel viewer"
        >
          <Image
            src={selectedImage.url}
            alt={selectedImage.alt}
            fill
            unoptimized={shouldDisableOptimization(selectedImage.url)}
            className="object-contain transition-transform duration-300 hover:scale-[1.02]"
            sizes="(max-width: 1024px) 100vw, 65vw"
          />

          {(selectedImage.caption || selectedImage.title) ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-5 pt-10">
              <p className="text-center font-sans text-sm text-white">
                {selectedImage.caption || selectedImage.title}
              </p>
            </div>
          ) : null}
        </div>

        {/* RIGHT COLUMN — Thumbnail Strip */}
        <div className="lg:flex-[3]">
          <div className="scrollbar-visible overflow-x-auto lg:h-[380px] lg:max-h-[380px] lg:overflow-y-auto lg:overflow-x-hidden">
            <div className="flex flex-row gap-2 lg:grid lg:grid-cols-2 lg:gap-0.5 lg:content-start">
              {normalizedImages.map((image, index) => {
                const isActive = index === selectedIndex;

                return (
                  <button
                    key={`thumb-${image.id || image.url}-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`relative flex h-[75px] w-[100px] shrink-0 overflow-hidden rounded-md transition-all duration-200 lg:aspect-square lg:w-full ${
                      isActive
                        ? "ring-2 ring-[#8b1a1a] ring-inset opacity-100"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      unoptimized={shouldDisableOptimization(image.url)}
                      className="object-cover"
                      sizes="(max-width: 1024px) 100px, 30vw"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1 pt-3">
                      <p className="truncate text-center font-sans text-[10px] leading-tight text-white">
                        {image.caption || image.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Carousel — opens when clicking the main image */}
      <GalleryCarousel
        images={normalizedImages}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />

      <style>{`
        .scrollbar-visible::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .scrollbar-visible::-webkit-scrollbar-track {
          background: #e5e0d8;
          border-radius: 9999px;
        }
        .scrollbar-visible::-webkit-scrollbar-thumb {
          background: #a89580;
          border-radius: 9999px;
          border: 2px solid #e5e0d8;
        }
        .scrollbar-visible::-webkit-scrollbar-thumb:hover {
          background: #8b7355;
        }
        .scrollbar-visible {
          scrollbar-width: thin;
          scrollbar-color: #a89580 #e5e0d8;
        }
      `}</style>
    </>
  );
}
