"use client";

import { useState, useEffect } from "react";
import { SessionSummary } from "@/lib/supabase/types";

interface ScoreRevealProps {
  summary: SessionSummary;
  onComplete?: () => void;
}

export function ScoreReveal({ summary, onComplete }: ScoreRevealProps) {
  const [step, setStep] = useState(0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m} minutes and ${sec} seconds`;
  };

  const metrics = [
    {
      text: `Your Optimizer kept you scrolling for ${formatTime(summary.duration_seconds)}.`,
    },
    {
      text: `They explored ${summary.dimensions_explored} of 5 personality dimensions.`,
    },
    {
      text: `Their picks held your attention ${summary.engagement_multiplier?.toFixed(1)}x longer than random videos.`,
    },
  ];

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    metrics.forEach((_, i) => {
      timers.push(
        setTimeout(() => setStep(i + 1), (i + 1) * 2500)
      );
    });

    // Show score
    timers.push(
      setTimeout(() => setStep(metrics.length + 1), (metrics.length + 1) * 2500)
    );

    // Complete
    timers.push(
      setTimeout(() => onComplete?.(), (metrics.length + 2) * 2500 + 2000)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-8">
        {metrics.map((metric, i) => (
          <p
            key={i}
            className={`text-lg text-gray-300 leading-relaxed transition-all duration-700 ${
              step > i
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            {metric.text}
          </p>
        ))}

        {/* Score */}
        <div
          className={`transition-all duration-1000 ${
            step > metrics.length
              ? "opacity-100 scale-100"
              : "opacity-0 scale-75"
          }`}
        >
          <p className="text-xs text-gray-600 tracking-[0.3em] mb-2">SCORE</p>
          <p className="text-6xl font-bold text-accent glow-text score-pulse">
            {summary.optimizer_score.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-3 tracking-wider">
            Top 15% of all Optimizers
          </p>
        </div>
      </div>
    </div>
  );
}
