"use client";

import { TrendIndicator } from "@/lib/supabase/types";

interface DwellIndicatorProps {
  currentDwell: number;
  avgDwell: number;
  last5: number[];
  trend: TrendIndicator;
}

export function DwellIndicator({
  currentDwell,
  avgDwell,
  last5,
  trend,
}: DwellIndicatorProps) {
  const dwellSeconds = (currentDwell / 1000).toFixed(1);
  const avgSeconds = (avgDwell / 1000).toFixed(1);
  const aboveAvg = currentDwell > avgDwell;

  // Sparkline bar chart
  const maxDwell = Math.max(...last5, 1);

  return (
    <div className="border border-gray-800 bg-black/50 p-3">
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <p className="text-[10px] text-gray-600 tracking-widest">DWELL</p>
          <p className="text-2xl font-bold tracking-wider">
            {dwellSeconds}s
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-600">avg: {avgSeconds}s</p>
          <span
            className={`text-sm ${aboveAvg ? "text-green-400" : "text-red-400"}`}
          >
            {aboveAvg ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Sparkline */}
      {last5.length > 0 && (
        <div className="flex items-end gap-1 h-8">
          {last5.map((dwell, i) => {
            const pct = (dwell / maxDwell) * 100;
            const isAboveAvg = dwell > avgDwell;
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${pct}%`,
                  backgroundColor: isAboveAvg
                    ? "rgba(34, 197, 94, 0.6)"
                    : "rgba(239, 68, 68, 0.6)",
                  minHeight: "2px",
                }}
              />
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-600 mt-1 tracking-wider">
        Last 5 videos
      </p>
    </div>
  );
}
