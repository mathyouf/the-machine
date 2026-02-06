"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Video } from "@/lib/supabase/types";
import { TextCardDisplay } from "./TextCard";

interface VideoFeedProps {
  videos: Video[];
  onDwellEvent?: (videoId: string, dwellMs: number, scrollVelocity: number) => void;
  pendingTextCard?: string | null;
  onTextCardDismissed?: () => void;
  sessionActive?: boolean;
  sessionStartTime?: number;
  onEndSession?: () => void;
}

export function VideoFeed({
  videos,
  onDwellEvent,
  pendingTextCard,
  onTextCardDismissed,
  sessionActive = true,
  sessionStartTime,
  onEndSession,
}: VideoFeedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTextCard, setShowTextCard] = useState(false);
  const [textCardContent, setTextCardContent] = useState("");
  const [showDoneButton, setShowDoneButton] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const videoStartRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentVideo = videos[currentIndex];

  // Initialize video start time on mount
  useEffect(() => {
    videoStartRef.current = Date.now();
  }, []);

  // Show "Done for now" button after 5 minutes
  useEffect(() => {
    if (!sessionStartTime) return;
    const timer = setTimeout(() => {
      setShowDoneButton(true);
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearTimeout(timer);
  }, [sessionStartTime]);

  // Handle incoming text cards from optimizer
  useEffect(() => {
    if (pendingTextCard) {
      const showTimer = setTimeout(() => {
        setTextCardContent(pendingTextCard);
        setShowTextCard(true);
      }, 0);
      const hideTimer = setTimeout(() => {
        setShowTextCard(false);
        onTextCardDismissed?.();
      }, 3000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [pendingTextCard, onTextCardDismissed]);

  const advanceVideo = useCallback(() => {
    const now = Date.now();
    const dwellMs = now - videoStartRef.current;
    const scrollVelocity = touchStartTime
      ? 1000 / Math.max(now - touchStartTime, 1)
      : 500;

    if (currentVideo) {
      onDwellEvent?.(currentVideo.id, dwellMs, scrollVelocity);
    }

    setCurrentIndex((prev) => (prev + 1) % videos.length);
    videoStartRef.current = Date.now();
  }, [currentVideo, onDwellEvent, touchStartTime, videos.length]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        advanceVideo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advanceVideo]);

  // Touch/swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
    setTouchStartTime(Date.now());
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientY;
    if (diff > 50) {
      advanceVideo();
    }
    setTouchStart(null);
    setTouchStartTime(null);
  };

  // Mouse wheel support
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.deltaY > 30) {
        advanceVideo();
      }
    },
    [advanceVideo]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("wheel", handleWheel, { passive: true });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  if (!currentVideo) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black hide-scrollbar overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* YouTube Video Embed */}
      <div className="absolute inset-0">
        <iframe
          key={currentVideo.id}
          src={`https://www.youtube-nocookie.com/embed/${currentVideo.youtube_id}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0&playsinline=1&mute=1&loop=1`}
          className="w-full h-full object-cover"
          style={{ border: "none", pointerEvents: "none" }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>

      {/* Gradient overlays for clean look */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />

      {/* Swipe hint indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/30 pointer-events-none">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 animate-bounce"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-xs tracking-widest mt-1">SWIPE UP</span>
      </div>

      {/* Camera PiP (top right) */}
      <div className="absolute top-4 right-4 w-20 h-28 bg-gray-900 rounded-lg overflow-hidden border border-gray-700/50 shadow-lg">
        <video
          id="scroller-camera"
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>

      {/* Text Card Interstitial */}
      {showTextCard && (
        <TextCardDisplay content={textCardContent} />
      )}

      {/* Done for now button (appears after 5 min) */}
      {showDoneButton && sessionActive && (
        <button
          onClick={onEndSession}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 text-white/40 text-xs tracking-widest border border-white/10 hover:border-white/30 hover:text-white/60 transition-all"
        >
          DONE FOR NOW
        </button>
      )}

      {/* Video counter (very subtle) */}
      <div className="absolute top-4 left-4 text-white/20 text-xs tracking-wider">
        {currentIndex + 1}
      </div>
    </div>
  );
}
