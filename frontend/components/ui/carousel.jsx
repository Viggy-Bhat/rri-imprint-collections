"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Carousel({ 
  children, 
  className = "", 
  autoplay = false, 
  interval = 5000,
  showThumbnails = true,
  showFullscreen = false 
}) {
  const [current, setCurrent] = useState(0);
  const slides = Array.isArray(children) ? children : [children];
  const [isAutoplay, setIsAutoplay] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const startAutoplay = useCallback(() => {
    if (!isAutoplay) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, interval);
  }, [isAutoplay, interval, slides.length]);

  const stopAutoplay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAutoplay && slides.length > 1) {
      startAutoplay();
    }
    return () => stopAutoplay();
  }, [isAutoplay, slides.length, startAutoplay, stopAutoplay]);

  const goToSlide = (index) => {
    setCurrent(index);
    if (autoplay) {
      setIsAutoplay(false);
    }
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
    if (autoplay) setIsAutoplay(false);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    if (autoplay) setIsAutoplay(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!slides.length) return null;

  const currentSlide = slides[current];

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Main Carousel */}
      <div className="relative bg-neutral-900 rounded-xl overflow-hidden group">
        {/* Slides Container */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-in-out",
                idx === current 
                  ? "opacity-100 scale-100" 
                  : "opacity-0 scale-105 pointer-events-none"
              )}
            >
              {slide}
            </div>
          ))}
          
          {/* Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Previous slide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                aria-label="Next slide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Slide Counter */}
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-10">
            {current + 1} / {slides.length}
          </div>

          {/* Autoplay Toggle */}
          {slides.length > 1 && (
            <button
              onClick={() => setIsAutoplay(!isAutoplay)}
              className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10"
              aria-label={isAutoplay ? "Pause autoplay" : "Start autoplay"}
            >
              {isAutoplay ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
          )}

          {/* Fullscreen Toggle */}
          {showFullscreen && slides.length > 0 && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-3 left-12 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10"
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Dot Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  idx === current 
                    ? "bg-white w-6" 
                    : "bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && slides.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {slides.map((slide, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={cn(
                "flex-shrink-0 w-20 h-14 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all duration-200 border-2",
                idx === current 
                  ? "border-[#8b1c1c] opacity-100" 
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              {slide}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={toggleFullscreen}
        >
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Close fullscreen"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {currentSlide}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Next"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {current + 1} / {slides.length}
          </div>
        </div>
      )}
    </div>
  );
}

export function CarouselSlide({ src, alt, className = "", caption = "" }) {
  return (
    <div className={cn("w-full h-full", className)}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        loading="lazy"
      />
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="text-white text-center text-sm md:text-base">{caption}</p>
        </div>
      )}
    </div>
  );
}
