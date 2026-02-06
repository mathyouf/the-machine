"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-black text-white sacred-geometry-bg">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <svg viewBox="0 0 400 400" className="w-[600px] h-[600px]">
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="none"
              stroke="#00ff88"
              strokeWidth="0.5"
            />
            <circle
              cx="200"
              cy="200"
              r="120"
              fill="none"
              stroke="#00ff88"
              strokeWidth="0.5"
            />
            <circle
              cx="200"
              cy="200"
              r="60"
              fill="none"
              stroke="#00ff88"
              strokeWidth="0.5"
            />
            <line
              x1="20"
              y1="200"
              x2="380"
              y2="200"
              stroke="#00ff88"
              strokeWidth="0.3"
            />
            <line
              x1="200"
              y1="20"
              x2="200"
              y2="380"
              stroke="#00ff88"
              strokeWidth="0.3"
            />
            <line
              x1="73"
              y1="73"
              x2="327"
              y2="327"
              stroke="#00ff88"
              strokeWidth="0.3"
            />
            <line
              x1="327"
              y1="73"
              x2="73"
              y2="327"
              stroke="#00ff88"
              strokeWidth="0.3"
            />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-2xl">
          <p className="text-accent/60 text-sm tracking-[0.3em] uppercase mb-4">
            experiments.dating presents
          </p>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight glow-text mb-6">
            THE
            <br />
            MACHINE
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-lg mx-auto mb-12 leading-relaxed">
            A stranger watches you scroll. They control what you see. Then you
            meet.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/session/demo/scroller"
              className="px-8 py-3 bg-accent text-black font-bold tracking-wider hover:bg-accent/80 transition-all"
            >
              DEMO: BE THE SCROLLER
            </Link>
            <Link
              href="/session/demo/optimizer"
              className="px-8 py-3 border border-accent text-accent font-bold tracking-wider hover:bg-accent/10 transition-all"
            >
              DEMO: BE THE OPTIMIZER
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href="/session/demo/reveal"
              className="text-sm text-gray-500 hover:text-accent/60 transition-colors tracking-wider"
            >
              PREVIEW THE REVEAL SEQUENCE
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 text-gray-600 text-xs tracking-widest animate-pulse">
          SCROLL TO LEARN MORE
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-accent text-sm tracking-[0.3em] uppercase mb-12 text-center">
          HOW IT WORKS
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: 1,
              title: "SCROLL",
              desc: "You watch a TikTok-style video feed. You scroll. You react. You don't know someone is watching.",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="2" />
                  <path d="M9 10l3-3 3 3" />
                </svg>
              ),
            },
            {
              step: 2,
              title: "OPTIMIZE",
              desc: "Your Optimizer sees your face. They pick what videos come next. They send you messages disguised as algorithm prompts.",
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M8 21h8" />
                  <path d="M12 17v4" />
                </svg>
              ),
            },
            {
              step: 3,
              title: "REVEAL",
              desc: '"These messages were written by a real person." Your taste fingerprint. Your Optimizer\'s score. Then: would you like to meet them?',
              icon: (
                <svg
                  viewBox="0 0 24 24"
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              ),
            },
          ].map(({ step, title, desc, icon }) => (
            <div
              key={step}
              className={`border border-gray-800 p-6 transition-all duration-300 ${
                hoveredStep === step
                  ? "border-accent/50 bg-accent/5"
                  : "hover:border-gray-700"
              }`}
              onMouseEnter={() => setHoveredStep(step)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div className="text-accent mb-4">{icon}</div>
              <div className="text-accent/40 text-xs tracking-widest mb-2">
                STEP {step}
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-wider">
                {title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Dimensions */}
      <div className="max-w-4xl mx-auto px-6 py-24 border-t border-gray-900">
        <h2 className="text-accent text-sm tracking-[0.3em] uppercase mb-4 text-center">
          THE FIVE DIMENSIONS
        </h2>
        <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
          300 videos mapped across five psychological entertainment preference
          dimensions. Your Optimizer navigates this space to map your
          personality.
        </p>

        <div className="space-y-3">
          {[
            {
              dim: "COMMUNAL",
              desc: "Warmth, family, romance, social bonding",
              color: "#f59e0b",
              width: "72%",
            },
            {
              dim: "AESTHETIC",
              desc: "Beauty, art, complexity, reflection",
              color: "#8b5cf6",
              width: "85%",
            },
            {
              dim: "DARK",
              desc: "Horror, thriller, edgy, transgressive",
              color: "#ef4444",
              width: "35%",
            },
            {
              dim: "THRILLING",
              desc: "Action, adventure, risk, spectacle",
              color: "#06b6d4",
              width: "48%",
            },
            {
              dim: "CEREBRAL",
              desc: "Documentary, science, informational",
              color: "#22c55e",
              width: "68%",
            },
          ].map(({ dim, desc, color, width }) => (
            <div key={dim} className="group">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold tracking-wider">{dim}</span>
                <span className="text-xs text-gray-600">{desc}</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 group-hover:opacity-100 opacity-70"
                  style={{ width, backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-8 tracking-wider">
          EXAMPLE TASTE FINGERPRINT
        </p>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-24 border-t border-gray-900 text-center">
        <h2 className="text-3xl font-bold mb-4 tracking-wider">
          THE MACHINE RUNS
          <br />
          <span className="text-accent glow-text">THURSDAYS AT 8PM EST</span>
        </h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Limited slots. Scheduled sessions only. Sign up to be matched with a
          stranger.
        </p>
        <Link
          href="/session/new/lobby"
          className="inline-block px-12 py-4 bg-accent text-black font-bold tracking-widest text-lg hover:bg-accent/80 transition-all"
        >
          JOIN THE NEXT SESSION
        </Link>

        <div className="mt-16 flex gap-8 justify-center text-gray-600 text-xs tracking-widest">
          <Link href="/leaderboard" className="hover:text-accent transition">
            LEADERBOARD
          </Link>
          <span className="text-gray-800">|</span>
          <span className="cursor-default">ABOUT</span>
          <span className="text-gray-800">|</span>
          <span className="cursor-default">RESEARCH</span>
        </div>

        <p className="mt-12 text-gray-800 text-xs tracking-wider">
          experiments.dating
        </p>
      </div>
    </div>
  );
}
