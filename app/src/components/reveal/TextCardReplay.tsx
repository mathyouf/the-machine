"use client";

import { useState, useEffect } from "react";
import { TextCard } from "@/lib/supabase/types";

interface TextCardReplayProps {
  cards: TextCard[];
  onComplete?: () => void;
}

export function TextCardReplay({ cards, onComplete }: TextCardReplayProps) {
  const [visibleIndex, setVisibleIndex] = useState(-1);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    // Show cards one by one
    const timers: NodeJS.Timeout[] = [];

    cards.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleIndex(i);
        }, (i + 1) * 2000)
      );
    });

    // Show the reveal message after all cards
    timers.push(
      setTimeout(() => {
        setShowReveal(true);
      }, (cards.length + 1) * 2000)
    );

    // Complete after reveal sinks in
    timers.push(
      setTimeout(() => {
        onComplete?.();
      }, (cards.length + 2) * 2000 + 3000)
    );

    return () => timers.forEach(clearTimeout);
  }, [cards, onComplete]);

  const formatTimestamp = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <p className="text-xs text-gray-600 tracking-[0.3em] text-center mb-8">
          DURING YOUR SESSION, THE ALGORITHM SAID:
        </p>

        {cards.map((card, i) => (
          <div
            key={card.id}
            className={`transition-all duration-700 ${
              i <= visibleIndex
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-[10px] text-gray-700 shrink-0 mt-1 tracking-wider">
                {formatTimestamp(card.sent_at_ms)}
              </span>
              <div className="bg-black/85 border border-gray-800 px-4 py-3 flex-1">
                <p className="font-mono text-white text-sm leading-relaxed">
                  {card.content}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* The Reveal */}
        <div
          className={`transition-all duration-1000 mt-12 text-center ${
            showReveal
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-8"
          }`}
        >
          <div className="border border-accent/30 bg-accent/5 px-6 py-4">
            <p className="text-accent text-lg tracking-wider font-bold">
              These messages were written by a real person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
