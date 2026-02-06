"use client";

import { useState, useEffect } from "react";

interface FaceFeedPanelProps {
  frame?: string | null;
}

export function FaceFeedPanel({ frame }: FaceFeedPanelProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  // Simulate frame updates (in production this would be Realtime snapshots)
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h3 className="text-xs text-gray-500 tracking-widest mb-2">
        SCROLLER FACE
      </h3>
      <div className="relative aspect-[3/4] bg-gray-900 border border-gray-800 overflow-hidden">
        {frame ? (
          <img
            src={frame}
            alt="Scroller camera"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              </div>
              <p className="text-gray-600 text-xs tracking-wider">
                LIVE FEED
              </p>
              <p className="text-gray-700 text-[10px] mt-1">
                Frame #{frameIndex}
              </p>
            </div>
          </div>
        )}

        {/* Connection indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-green-500/70">LIVE</span>
        </div>

        {/* Scanline effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)`,
          }}
        />
      </div>
    </div>
  );
}
