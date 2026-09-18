"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface CarouselSlide {
  src: string;
  alt: string;
}

interface ImageCarouselProps {
  slides: CarouselSlide[];
  /** Milliseconds between automatic slide changes */
  intervalMs?: number;
  /** Milliseconds the crossfade transition takes */
  transitionMs?: number;
}

export default function ImageCarousel({
  slides,
  intervalMs = 5000,
  transitionMs = 900,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    if (isPaused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
  }, [clearTimer, intervalMs, isPaused, slides.length]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const goTo = (index: number) => {
    setActiveIndex(((index % slides.length) + slides.length) % slides.length);
    // Restart the autoplay clock whenever the user takes manual control
    startTimer();
  };

  const goNext = () => goTo(activeIndex + 1);
  const goPrev = () => goTo(activeIndex - 1);

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-brand-navy"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Crossfading image layers */}
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          className="absolute inset-0"
          style={{
            opacity: index === activeIndex ? 1 : 0,
            transition: `opacity ${transitionMs}ms ease-in-out`,
          }}
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="60vw"
            className="object-cover"
          />
        </div>
      ))}

      {/* Bottom gradient for text legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/20 to-transparent" />

      {/* Trust badge */}
      <div className="absolute right-8 top-8 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-sm text-white backdrop-blur-sm">
        <ShieldIcon className="h-4 w-4" />
        <span>Trusted by healthcare professionals</span>
      </div>

      {/* Prev / next arrows */}
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous image"
        className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50"
      >
        <ArrowIcon direction="left" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next image"
        className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition hover:bg-black/50"
      >
        <ArrowIcon direction="right" />
      </button>

      {/* Headline overlay */}
      <div className="absolute bottom-16 left-10 right-10 text-white">
        <h2 className="font-serif text-4xl font-semibold leading-tight">
          Quality Healthcare, Made Simple
        </h2>
        <p className="mt-3 max-w-md text-white/80">
          Efficient hospital management for better care and healthier
          communities.
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-10 flex items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === activeIndex}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex
                ? "w-6 bg-white"
                : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-5 w-5 ${direction === "left" ? "rotate-180" : ""}`}
    >
      <path
        d="M4 12h16M14 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
