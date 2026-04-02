"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getWagtailBackendBaseUrl } from "@/app/lib/config";

const WAGTAIL_BACKEND_BASE = getWagtailBackendBaseUrl();

function toAbsoluteMediaUrl(url) {
  const value = String(url || "").trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${WAGTAIL_BACKEND_BASE}${value}`;
  }

  return value;
}

function extractImageUrl(imageValue) {
  if (!imageValue) {
    return "";
  }

  return toAbsoluteMediaUrl(
    imageValue.url ||
      imageValue?.file?.url ||
      imageValue?.meta?.download_url ||
      ""
  );
}

function shouldDisableOptimization(url) {
  const value = String(url || "").trim();

  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname;

    if (host === "localhost" || host === "127.0.0.1") {
      return true;
    }

    if (/^10\./.test(host)) {
      return true;
    }

    if (/^192\.168\./.test(host)) {
      return true;
    }

    const seventeenRange = /^172\.(1[6-9]|2\d|3[0-1])\./;
    if (seventeenRange.test(host)) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function normalizeImageEntry(entry, index) {
  const value = entry?.value || entry || {};
  const imageValue = value?.image || value;

  const imageId =
    typeof imageValue === "number"
      ? imageValue
      : Number(imageValue?.id || value?.id || 0) || null;

  const url =
    typeof imageValue === "string"
      ? toAbsoluteMediaUrl(imageValue)
      : extractImageUrl(imageValue);

  const caption = String(value?.caption || value?.title || "").trim();
  const title = String(
    imageValue?.title || value?.title || `Gallery image ${index + 1}`
  ).trim();

  return {
    id: imageId,
    url,
    title,
    caption,
    alt: caption || title || `Gallery image ${index + 1}`,
  };
}

export default function GalleryGridCarousel({ images = [] }) {
  const normalized = useMemo(
    () => (Array.isArray(images) ? images : []).map(normalizeImageEntry),
    [images]
  );

  const [resolvedImages, setResolvedImages] = useState(normalized);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setResolvedImages(normalized);
  }, [normalized]);

  const visibleImages = useMemo(
    () => resolvedImages.filter((img) => Boolean(img.url)),
    [resolvedImages]
  );

  useEffect(() => {
    if (visibleImages.length === 0) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex((prevIndex) =>
      Math.min(prevIndex, visibleImages.length - 1)
    );
  }, [visibleImages.length]);

  useEffect(() => {
    const unresolved = resolvedImages.filter((img) => !img.url && img.id);

    if (unresolved.length === 0) {
      return;
    }

    let isCancelled = false;

    async function hydrateMissingUrls() {
      const updates = await Promise.all(
        unresolved.map(async (img) => {
          try {
            const response = await fetch(
              `${WAGTAIL_BACKEND_BASE}/api/images/${img.id}/`,
              { cache: "force-cache" }
            );

            if (!response.ok) {
              return null;
            }

            const imageData = await response.json();
            const fetchedUrl = extractImageUrl(imageData);

            if (!fetchedUrl) {
              return null;
            }

            return {
              id: img.id,
              url: fetchedUrl,
              title: String(imageData?.title || img.title || "").trim() || img.title,
            };
          } catch {
            return null;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      const mapped = new Map(
        updates.filter(Boolean).map((entry) => [entry.id, entry])
      );

      if (mapped.size === 0) {
        return;
      }

      setResolvedImages((current) =>
        current.map((img) => {
          if (!img.id || !mapped.has(img.id)) {
            return img;
          }

          const found = mapped.get(img.id);
          return {
            ...img,
            url: found.url,
            title: found.title || img.title,
            alt: img.caption || found.title || img.alt,
          };
        })
      );
    }

    hydrateMissingUrls();

    return () => {
      isCancelled = true;
    };
  }, [resolvedImages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key === "ArrowRight") {
        if (visibleImages.length > 0) {
          setActiveIndex((prev) => (prev + 1) % visibleImages.length);
        }
      }

      if (event.key === "ArrowLeft") {
        if (visibleImages.length > 0) {
          setActiveIndex(
            (prev) => (prev - 1 + visibleImages.length) % visibleImages.length
          );
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, visibleImages.length]);

  if (visibleImages.length === 0) {
    return <p className="text-sm text-gray-600">No gallery images available.</p>;
  }

  const openAt = (index) => {
    setActiveIndex(index);
    setIsOpen(true);
  };

  const goTo = (index) => {
    if (visibleImages.length === 0) {
      return;
    }

    setActiveIndex((index + visibleImages.length) % visibleImages.length);
  };

  const prev = () => {
    setActiveIndex((prevIndex) =>
      (prevIndex - 1 + visibleImages.length) % visibleImages.length
    );
  };

  const next = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % visibleImages.length);
  };

  const currentImage = visibleImages[activeIndex] || visibleImages[0];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleImages.map((img, index) => (
          <button
            key={`${img.id || img.url}-${index}`}
            type="button"
            className="group relative aspect-4/3 overflow-hidden rounded-xl border border-red-100/80 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            onClick={() => openAt(index)}
            aria-label={`Open image ${index + 1} in gallery carousel`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              unoptimized={shouldDisableOptimization(img.url)}
              className="object-cover transition duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-2.5 py-2 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <p className="truncate text-xs font-medium text-white">
                {img.caption || img.title}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isOpen && currentImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery carousel"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
            onClick={() => setIsOpen(false)}
            aria-label="Close gallery"
          >
            X
          </button>

          <button
            type="button"
            className="absolute left-3 md:left-6 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              prev();
            }}
            aria-label="Previous image"
          >
            <span aria-hidden="true">&lt;</span>
          </button>

          <div
            className="relative w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-[70vh] min-h-96 w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {visibleImages.map((img, index) => (
                  <div key={`${img.id || img.url}-${index}`} className="relative h-full min-w-full px-3 py-3 md:px-4 md:py-4">
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      unoptimized={shouldDisableOptimization(img.url)}
                      className="object-contain"
                      sizes="(max-width: 1280px) 92vw, 1200px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-sm text-white/90">
              <p className="truncate pr-4">{currentImage.caption || currentImage.title}</p>
              <p>
                {activeIndex + 1} / {visibleImages.length}
              </p>
            </div>

            {visibleImages.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {visibleImages.map((img, index) => (
                  <button
                    key={`thumb-${img.id || img.url}-${index}`}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-all ${
                      index === activeIndex
                        ? "border-white shadow-[0_0_0_1px_rgba(255,255,255,0.6)]"
                        : "border-white/30 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt}
                      fill
                      unoptimized={shouldDisableOptimization(img.url)}
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className="absolute right-3 md:right-6 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              next();
            }}
            aria-label="Next image"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </div>
      ) : null}
    </>
  );
}