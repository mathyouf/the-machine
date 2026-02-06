"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeaderboardEntry } from "@/lib/supabase/types";
import { fetchLeaderboard } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

// Demo leaderboard data
const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  {
    user_id: "1",
    display_name: "Alex K.",
    sessions_played: 12,
    best_score: 2341,
    avg_score: 1567,
    avg_retention_seconds: 1023,
    avg_info_gain: 5.2,
  },
  {
    user_id: "2",
    display_name: "Morgan R.",
    sessions_played: 8,
    best_score: 1892,
    avg_score: 1234,
    avg_retention_seconds: 876,
    avg_info_gain: 4.7,
  },
  {
    user_id: "3",
    display_name: "Sam T.",
    sessions_played: 15,
    best_score: 1756,
    avg_score: 1189,
    avg_retention_seconds: 812,
    avg_info_gain: 4.3,
  },
  {
    user_id: "4",
    display_name: "Jordan P.",
    sessions_played: 6,
    best_score: 1543,
    avg_score: 1098,
    avg_retention_seconds: 745,
    avg_info_gain: 3.9,
  },
  {
    user_id: "5",
    display_name: "Riley M.",
    sessions_played: 10,
    best_score: 1421,
    avg_score: 987,
    avg_retention_seconds: 689,
    avg_info_gain: 3.6,
  },
  {
    user_id: "6",
    display_name: "Casey L.",
    sessions_played: 4,
    best_score: 1174,
    avg_score: 892,
    avg_retention_seconds: 634,
    avg_info_gain: 3.2,
  },
  {
    user_id: "7",
    display_name: "Quinn W.",
    sessions_played: 7,
    best_score: 1089,
    avg_score: 756,
    avg_retention_seconds: 567,
    avg_info_gain: 2.8,
  },
  {
    user_id: "8",
    display_name: "Drew N.",
    sessions_played: 3,
    best_score: 934,
    avg_score: 645,
    avg_retention_seconds: 489,
    avg_info_gain: 2.4,
  },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(DEMO_LEADERBOARD);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchLeaderboard().then((data) => {
      if (data.length > 0) setEntries(data);
    });
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 sacred-geometry-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link
              href="/"
              className="text-xs text-gray-600 tracking-widest hover:text-accent transition-colors"
            >
              &larr; THE MACHINE
            </Link>
            <h1 className="text-3xl font-bold tracking-wider mt-2 glow-text">
              LEADERBOARD
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Top Optimizers ranked by best session score
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border border-gray-800">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-800 text-[10px] text-gray-600 tracking-widest">
            <div className="col-span-1">RANK</div>
            <div className="col-span-3">OPTIMIZER</div>
            <div className="col-span-2 text-right">BEST SCORE</div>
            <div className="col-span-2 text-right hidden sm:block">AVG SCORE</div>
            <div className="col-span-2 text-right">RETENTION</div>
            <div className="col-span-2 text-right hidden sm:block">SESSIONS</div>
          </div>

          {/* Rows */}
          {entries.map((entry, i) => (
            <div
              key={entry.user_id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-900 hover:bg-accent/5 transition-colors ${
                i < 3 ? "bg-accent/[0.02]" : ""
              }`}
            >
              <div className="col-span-1">
                <span
                  className={`text-sm font-bold ${
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                        ? "text-gray-300"
                        : i === 2
                          ? "text-amber-700"
                          : "text-gray-600"
                  }`}
                >
                  {i + 1}
                </span>
              </div>
              <div className="col-span-3">
                <span className="text-sm tracking-wider">
                  {entry.display_name}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold text-accent">
                  {entry.best_score.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 text-right hidden sm:block">
                <span className="text-sm text-gray-400">
                  {Math.floor(entry.avg_score).toLocaleString()}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm text-gray-400">
                  {formatTime(entry.avg_retention_seconds)}
                </span>
              </div>
              <div className="col-span-2 text-right hidden sm:block">
                <span className="text-sm text-gray-500">
                  {entry.sessions_played}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-700 tracking-wider">
            Score = Retention x Engagement Multiplier x Exploration Multiplier
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-8 py-2 border border-gray-800 text-gray-500 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
          >
            BACK TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
