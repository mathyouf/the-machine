"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Video, RentfrowDimension, TrendIndicator, ScrollEvent } from "@/lib/supabase/types";
import { DEMO_VIDEOS, getVideosByDimension, DIMENSION_LABELS } from "@/lib/demo-data";
import { FaceFeedPanel } from "./FaceFeed";
import { DimensionMap } from "./DimensionMap";
import { VideoPickerPanel } from "./VideoPickerPanel";
import { TextCardComposer } from "./TextCardComposer";
import { ScorePanel } from "./ScorePanel";
import { DwellIndicator } from "./DwellIndicator";
import {
  UmapVisualization,
  generateDemoUmapPoints,
} from "../shared/UmapVisualization";

interface DemoScrollEvent {
  videoId: string;
  dwellMs: number;
  dimension: RentfrowDimension;
  queuedBy: "system" | "optimizer";
  timestamp: number;
}

export function OptimizerDashboard() {
  const [sessionTime, setSessionTime] = useState(0);
  const [scrollEvents, setScrollEvents] = useState<DemoScrollEvent[]>([]);
  const [currentDwell, setCurrentDwell] = useState(0);
  const [dangerZone, setDangerZone] = useState(false);
  const [textCards, setTextCards] = useState<{ content: string; time: number }[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<RentfrowDimension>("communal");
  const [queuedVideos, setQueuedVideos] = useState<Video[]>([]);
  const sessionStartRef = useRef(Date.now());

  // Simulate session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate incoming scroll events for demo
  useEffect(() => {
    const dims: RentfrowDimension[] = ["communal", "aesthetic", "dark", "thrilling", "cerebral"];
    const interval = setInterval(() => {
      const dim = dims[Math.floor(Math.random() * dims.length)];
      const dwell = 2000 + Math.floor(Math.random() * 12000);
      const event: DemoScrollEvent = {
        videoId: `sim-${Date.now()}`,
        dwellMs: dwell,
        dimension: dim,
        queuedBy: Math.random() > 0.5 ? "optimizer" : "system",
        timestamp: Date.now() - sessionStartRef.current,
      };
      setScrollEvents((prev) => [...prev, event]);
      setCurrentDwell(dwell);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Check danger zone (3+ declining dwells)
  useEffect(() => {
    if (scrollEvents.length < 3) return;
    const last3 = scrollEvents.slice(-3);
    const declining = last3.every(
      (e, i) => i === 0 || e.dwellMs < last3[i - 1].dwellMs
    );
    setDangerZone(declining);
  }, [scrollEvents]);

  // Dimension exploration counts
  const dimensionCounts = scrollEvents.reduce(
    (acc, e) => {
      acc[e.dimension] = (acc[e.dimension] || 0) + 1;
      return acc;
    },
    {} as Record<RentfrowDimension, number>
  );

  // Average dwell time
  const avgDwell =
    scrollEvents.length > 0
      ? Math.floor(
          scrollEvents.reduce((s, e) => s + e.dwellMs, 0) / scrollEvents.length
        )
      : 0;

  // Last 5 dwells for sparkline
  const last5Dwells = scrollEvents.slice(-5).map((e) => e.dwellMs);

  // Trend indicator
  const getTrend = (): TrendIndicator => {
    if (last5Dwells.length < 3) return "NEUTRAL";
    const recent = last5Dwells.slice(-3);
    const allDecline = recent.every(
      (d, i) => i === 0 || d < recent[i - 1]
    );
    const allIncrease = recent.every(
      (d, i) => i === 0 || d > recent[i - 1]
    );
    if (allDecline) return "LOSING THEM";
    if (allIncrease) return "ENGAGED";
    return "NEUTRAL";
  };

  // Engagement multiplier
  const optimizerDwells = scrollEvents.filter((e) => e.queuedBy === "optimizer");
  const systemDwells = scrollEvents.filter((e) => e.queuedBy === "system");
  const avgOptDwell =
    optimizerDwells.length > 0
      ? optimizerDwells.reduce((s, e) => s + e.dwellMs, 0) / optimizerDwells.length
      : 0;
  const avgSysDwell =
    systemDwells.length > 0
      ? systemDwells.reduce((s, e) => s + e.dwellMs, 0) / systemDwells.length
      : 0;
  const engagementMultiplier =
    avgSysDwell > 0
      ? Math.min(3, Math.max(0.5, avgOptDwell / avgSysDwell))
      : 1.0;

  // Dimensions explored (>=3 videos)
  const dimsExplored = (Object.values(dimensionCounts) as number[]).filter(
    (c) => c >= 3
  ).length;

  // Score estimate
  const explorationMultiplier = 1.0 + 0.2 * (dimsExplored / 5);
  const estimatedScore = Math.floor(
    sessionTime * engagementMultiplier * explorationMultiplier
  );

  // UMAP points
  const umapPoints = generateDemoUmapPoints(
    {
      communal: (dimensionCounts.communal || 0) / Math.max(scrollEvents.length, 1),
      aesthetic: (dimensionCounts.aesthetic || 0) / Math.max(scrollEvents.length, 1),
      dark: (dimensionCounts.dark || 0) / Math.max(scrollEvents.length, 1),
      thrilling: (dimensionCounts.thrilling || 0) / Math.max(scrollEvents.length, 1),
      cerebral: (dimensionCounts.cerebral || 0) / Math.max(scrollEvents.length, 1),
    },
    scrollEvents.length
  );

  const handleQueueVideo = (video: Video) => {
    setQueuedVideos((prev) => [...prev, video]);
  };

  const handleSendTextCard = (content: string) => {
    setTextCards((prev) => [...prev, { content, time: sessionTime }]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const trend = getTrend();

  return (
    <div
      className={`min-h-screen bg-black text-white p-4 ${
        dangerZone ? "danger-zone" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-accent text-xs tracking-[0.3em]">
            THE MACHINE
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 text-xs tracking-widest">
            OPTIMIZER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold tracking-wider">
            {formatTime(sessionTime)}
          </span>
          <span
            className={`text-xs tracking-widest px-2 py-1 ${
              trend === "ENGAGED"
                ? "text-green-400 bg-green-400/10"
                : trend === "LOSING THEM"
                  ? "text-red-400 bg-red-400/10 animate-pulse"
                  : "text-gray-400 bg-gray-400/10"
            }`}
          >
            {trend}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Face + Dwell + Text Cards */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <FaceFeedPanel />
          <DwellIndicator
            currentDwell={currentDwell}
            avgDwell={avgDwell}
            last5={last5Dwells}
            trend={trend}
          />
          <TextCardComposer
            onSend={handleSendTextCard}
            history={textCards}
            sessionTime={sessionTime}
          />
        </div>

        {/* Right Column: Dimension Map + Video Picker + UMAP + Score */}
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <DimensionMap counts={dimensionCounts} totalEvents={scrollEvents.length} />

          <VideoPickerPanel
            selectedDimension={selectedDimension}
            onSelectDimension={setSelectedDimension}
            onQueueVideo={handleQueueVideo}
            queuedCount={queuedVideos.length}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs text-gray-500 tracking-widest mb-2">
                LIVE UMAP
              </h3>
              <UmapVisualization
                points={umapPoints}
                width={320}
                height={240}
                showTrail={true}
              />
            </div>
            <ScorePanel
              retention={sessionTime}
              engagement={engagementMultiplier}
              dimsExplored={dimsExplored}
              estimatedScore={estimatedScore}
            />
          </div>
        </div>
      </div>

      {/* Queued videos ticker */}
      {queuedVideos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-accent/20 p-2">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-accent text-xs tracking-widest shrink-0">
              QUEUE ({queuedVideos.length}):
            </span>
            {queuedVideos.slice(-5).map((v, i) => (
              <span key={i} className="text-gray-400 text-xs truncate max-w-[120px]">
                {v.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
