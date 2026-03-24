"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./button"

export function Carousel({ children, className = "", autoplay = false, interval = 3000 }) {
  const [current, setCurrent] = useState(0)
  const slides = Array.isArray(children) ? children : [children]
  const [isAutoplay, setIsAutoplay] = useState(autoplay)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!isAutoplay) return

    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, interval)

    return () => clearInterval(timerRef.current)
  }, [isAutoplay, slides.length, interval])

  const goToSlide = (index) => {
    setCurrent(index)
    setIsAutoplay(false)
  }

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length)
    setIsAutoplay(false)
  }

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoplay(false)
  }

  if (!slides.length) return null

  return (
    <div className={`relative w-full bg-neutral-100 rounded-lg overflow-hidden ${className}`}>
      {/* Slides */}
      <div className="relative w-full aspect-video overflow-hidden">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Controls - only show if more than 1 slide */}
      {slides.length > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors z-10"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === current ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
