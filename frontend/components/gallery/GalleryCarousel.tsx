"use client";

import Image from "next/image";
import { useEffect, useState, type TouchEvent } from "react";
import type { GalleryImage } from "./BentoGallery";

type GalleryCarouselProps = {
  images: GalleryImage[];
  activeIndex: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
};

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

export default function GalleryCarousel({
  images,
  activeIndex,
  onClose,
  onChange,
}: GalleryCarouselProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "ArrowRight") {
        onChange((activeIndex + 1) % images.length);
      }

      if (event.key === "ArrowLeft") {
        onChange((activeIndex - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, onChange, onClose]);

  if (activeIndex === null || images.length === 0) {
    return null;
  }

  const currentImage = images[activeIndex];
  const aboutImageHtml = String(currentImage?.aboutImageHtml || "").trim();

  const nextImage = () => {
    onChange((activeIndex + 1) % images.length);
  };

  const prevImage = () => {
    onChange((activeIndex - 1 + images.length) % images.length);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(event.touches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    setTouchEndX(event.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) {
      return;
    }

    const delta = touchStartX - touchEndX;

    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 text-3xl font-light text-white transition-opacity hover:opacity-80"
        aria-label="Close gallery"
      >
        ×
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          prevImage();
        }}
        className="absolute bottom-6 left-6 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur-sm transition hover:bg-white/20 md:bottom-auto md:left-6 md:top-1/2 md:-translate-y-1/2"
        aria-label="Previous image"
      >
        ←
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          nextImage();
        }}
        className="absolute bottom-6 right-6 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl text-white backdrop-blur-sm transition hover:bg-white/20 md:bottom-auto md:right-6 md:top-1/2 md:-translate-y-1/2"
        aria-label="Next image"
      >
        →
      </button>

      <div
        className="w-[95vw] max-w-7xl"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex max-h-[85vh] flex-col gap-4 md:flex-row md:gap-6">
          <div className="relative h-[52vh] overflow-hidden rounded-2xl bg-black md:h-[85vh] md:flex-1">
            <Image
              src={currentImage.url}
              alt={currentImage.alt}
              fill
              unoptimized={shouldDisableOptimization(currentImage.url)}
              onContextMenu={(event) => event.preventDefault()}
              draggable={false}
              className="object-contain"
              sizes="(max-width: 768px) 95vw, 70vw"
            />

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent px-4 pb-4 pt-12 text-center text-white md:px-6 md:pb-6">
              <p className="truncate text-sm md:text-base">
                {currentImage.caption || currentImage.title}
              </p>
              <p className="mt-1 text-xs text-white/70 md:text-sm">
                {activeIndex + 1} / {images.length}
              </p>
            </div>
          </div>

          {aboutImageHtml ? (
            <aside className="max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 text-gray-800 md:w-90 md:p-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">About this Image</h3>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: aboutImageHtml }}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}