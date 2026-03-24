"use client"

import { useState } from "react"
import { Carousel } from "@/components/ui/carousel"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function GalleryGrid({ gallery = [], subtitle = "" }) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  if (!gallery || gallery.length === 0) {
    return null
  }

  const galleryImages = gallery
    .map((item) => {
      const imageData = item?.value?.image || item?.image
      const caption = item?.value?.caption || item?.caption || ""

      if (!imageData) {
        return null
      }

      return {
        url: imageData?.meta?.download_url || imageData?.file || imageData?.url || "",
        caption,
      }
    })
    .filter((img) => img && img.url)

  if (galleryImages.length === 0) {
    return null
  }

  const handleImageClick = (index) => {
    setSelectedImageIndex(index)
    setIsDialogOpen(true)
  }

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length)
  }

  return (
    <section className="space-y-6">
      {subtitle && <p className="text-gray-600 text-center">{subtitle}</p>}

      {/* Gallery Grid */}
      <div className="gallery-grid">
        {galleryImages.map((img, index) => (
          <div
            key={index}
            className="gallery-item cursor-pointer"
            onClick={() => handleImageClick(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleImageClick(index)}
          >
            <img
              src={img.url}
              alt={img.caption || `Gallery image ${index + 1}`}
              className="gallery-image"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            {img.caption && <p className="gallery-caption">{img.caption}</p>}
          </div>
        ))}
      </div>

      {/* Image Viewer Dialog with Carousel */}
      {isDialogOpen && selectedImageIndex !== null && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <DialogContent className="max-w-4xl w-full p-0 bg-black/90">
            <div className="relative w-full aspect-video">
              {/* Carousel for large view */}
              <Carousel className="w-full h-full">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full h-full flex items-center justify-center bg-black"
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `Gallery image ${idx + 1}`}
                      className="max-w-full max-h-full object-contain"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                ))}
              </Carousel>

              {/* Navigation */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors z-10"
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors z-10"
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
                    {selectedImageIndex + 1} / {galleryImages.length}
                  </div>
                </>
              )}

              {/* Caption in modal */}
              {galleryImages[selectedImageIndex]?.caption && (
                <div className="absolute bottom-16 left-0 right-0 text-center text-white bg-black/40 px-4 py-3">
                  {galleryImages[selectedImageIndex].caption}
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setIsDialogOpen(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors z-10"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  )
}
