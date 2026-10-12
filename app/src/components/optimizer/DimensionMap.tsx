"use client";

import { RentfrowDimension } from "@/lib/supabase/types";
import { DIMENSION_LABELS } from "@/lib/demo-data";

interface DimensionMapProps {
  counts: Record<string, number>;
  totalEvents: number;
}

const DIMENSIONS: RentfrowDimension[] = [
  "communal",
  "aesthetic",
  "dark",
  "thrilling",
  "cerebral",
];

const EXPLORE_THRESHOLD = 3;

export function DimensionMap({ counts, totalEvents }: DimensionMapProps) {
  return (
    <div>
      <h3 className="text-xs text-gray-500 tracking-widest mb-2">
        DIMENSION MAP
      </h3>
      <div className="border border-gray-800 bg-black/50 p-4 space-y-3">
        {DIMENSIONS.map((dim) => {
          const count = counts[dim] || 0;
          const maxVideos = Math.max(totalEvents / 3, 6);
          const pct = Math.min(100, (count / maxVideos) * 100);
          const explored = count >= EXPLORE_THRESHOLD;
          const { label, color, description } = DIMENSION_LABELS[dim];

          return (
            <div key={dim} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-bold tracking-wider">
                    {label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">
                    {count} shown
                  </span>
                  {explored ? (
                    <span className="text-[10px] text-gray-500 tracking-wider">
                      MAPPED
                    </span>
                  ) : (
                    <span className="text-[10px] text-accent tracking-wider animate-pulse">
                      TRY
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: explored ? color : color + "60",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
