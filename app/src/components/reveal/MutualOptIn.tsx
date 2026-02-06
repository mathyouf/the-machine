"use client";

import { useState } from "react";

interface MutualOptInProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function MutualOptIn({ onAccept, onDecline }: MutualOptInProps) {
  const [choice, setChoice] = useState<"accept" | "decline" | null>(null);
  const [waiting, setWaiting] = useState(false);

  const handleAccept = () => {
    setChoice("accept");
    setWaiting(true);
    // In production, this broadcasts to the other participant and waits for mutual opt-in
    setTimeout(() => onAccept(), 2000);
  };

  const handleDecline = () => {
    setChoice("decline");
    onDecline();
  };

  if (waiting) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 tracking-wider">
            Waiting for your match...
          </p>
        </div>
      </div>
    );
  }

  if (choice === "decline") {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-lg text-gray-300 mb-4">
            Thanks for playing The Machine.
          </p>
          <p className="text-gray-500 text-sm">
            Your taste fingerprint has been saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-xs text-gray-600 tracking-[0.3em] mb-6">
          THE REVEAL
        </p>

        <p className="text-xl text-white mb-2 leading-relaxed">
          The person who was watching you
        </p>
        <p className="text-xl text-white mb-8 leading-relaxed">
          wants to meet you.
        </p>

        <p className="text-gray-400 mb-12 text-sm">
          Would you like to meet them?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAccept}
            className="px-10 py-3 bg-accent text-black font-bold tracking-widest hover:bg-accent/80 transition-all"
          >
            YES, LET&apos;S MEET
          </button>
          <button
            onClick={handleDecline}
            className="px-10 py-3 border border-gray-700 text-gray-400 tracking-widest hover:border-gray-500 transition-all"
          >
            NOT THIS TIME
          </button>
        </div>
      </div>
    </div>
  );
}
