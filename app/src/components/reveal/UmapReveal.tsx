"use client";

import { useState, useEffect } from "react";
import {
  UmapVisualization,
  generateDemoUmapPoints,
} from "../shared/UmapVisualization";
import { DIMENSION_LABELS } from "@/lib/demo-data";
import { RentfrowDimension } from "@/lib/supabase/types";

interface UmapRevealProps {
  featureVector: Record<string, number>;
  onComplete?: () => void;
}

export function UmapReveal({ featureVector, onComplete }: UmapRevealProps) {
  const [showLabel, setShowLabel] = useState(false);
  const [showDimensions, setShowDimensions] = useState(false);
  const points = generateDemoUmapPoints(featureVector, 22);

  // Sorted dimensions for display
  const sortedDims = (Object.entries(featureVector) as [RentfrowDimension, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  useEffect(() => {
    const labelTimer = setTimeout(() => setShowLabel(true), 2000);
    const dimTimer = setTimeout(() => setShowDimensions(true), 5000);
    const completeTimer = setTimeout(() => onComplete?.(), 10000);

    return () => {
      clearTimeout(labelTimer);
      clearTimeout(dimTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      <div className="relative">
        <UmapVisualization
          points={points}
          width={360}
          height={360}
          animated={true}
          showTrail={true}
          className="border-accent/20"
        />
      </div>

      <div
        className={`mt-8 text-center transition-opacity duration-1000 ${
          showLabel ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="text-lg text-white/80 tracking-wider">
          This is your taste fingerprint.
        </p>
      </div>

      <div
        className={`mt-6 space-y-2 transition-opacity duration-1000 ${
          showDimensions ? "opacity-100" : "opacity-0"
        }`}
      >
        {sortedDims.map(([dim, value], i) => {
          const info = DIMENSION_LABELS[dim];
          return (
            <div
              key={dim}
              className="flex items-center gap-3"
            >
              <span className="text-xs text-gray-500 w-4">{i + 1}.</span>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: info.color }}
              />
              <span className="text-sm tracking-wider" style={{ color: info.color }}>
                {info.label}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(value * 100)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
