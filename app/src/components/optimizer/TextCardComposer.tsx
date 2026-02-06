"use client";

import { useState } from "react";

interface TextCardComposerProps {
  onSend: (content: string) => void;
  history: { content: string; time: number }[];
  sessionTime: number;
}

const SUGGESTIONS = [
  "We noticed you paused on that one.",
  "You might like this next.",
  "Interesting.",
  "What if we tried something different?",
  "You keep coming back to this.",
  "Almost there. One more.",
  "This one is for you.",
  "Trust us on this one.",
];

export function TextCardComposer({
  onSend,
  history,
  sessionTime,
}: TextCardComposerProps) {
  const [text, setText] = useState("");
  const maxLen = 140;

  const handleSend = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > maxLen) return;
    onSend(trimmed);
    setText("");
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <h3 className="text-xs text-gray-500 tracking-widest mb-2">
        TEXT CARD COMPOSER
      </h3>
      <div className="border border-gray-800 bg-black/50 p-3 space-y-3">
        {/* Input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, maxLen))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write as the algorithm..."
            className="w-full bg-gray-900 border border-gray-700 text-white font-mono text-sm p-3 resize-none h-20 focus:border-accent focus:outline-none placeholder:text-gray-600"
          />
          <span
            className={`absolute bottom-2 right-2 text-[10px] ${
              text.length > 120
                ? "text-amber-500"
                : text.length > 0
                  ? "text-gray-500"
                  : "text-gray-700"
            }`}
          >
            {text.length}/{maxLen}
          </span>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={text.trim().length === 0}
          className={`w-full py-2 text-xs tracking-widest font-bold transition-all ${
            text.trim().length > 0
              ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              : "bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800"
          }`}
        >
          SEND CARD
        </button>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1">
          {SUGGESTIONS.slice(0, 4).map((s, i) => (
            <button
              key={i}
              onClick={() => setText(s)}
              className="text-[9px] text-gray-600 hover:text-gray-400 px-1.5 py-0.5 border border-gray-800 hover:border-gray-600 transition-colors truncate max-w-[140px]"
            >
              {s}
            </button>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="border-t border-gray-800 pt-2 space-y-1 max-h-32 overflow-y-auto">
            <p className="text-[10px] text-gray-600 tracking-widest">
              SENT CARDS
            </p>
            {history.map((card, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs"
              >
                <span className="text-gray-700 shrink-0 text-[10px]">
                  {formatTime(card.time)}
                </span>
                <span className="text-gray-400 font-mono">
                  &ldquo;{card.content}&rdquo;
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
