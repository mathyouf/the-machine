"use client";

import { useState } from "react";
import { Video, RentfrowDimension } from "@/lib/supabase/types";
import { DIMENSION_LABELS } from "@/lib/demo-data";
import { DIMENSIONS, getVideosByDimension } from "@/lib/video-utils";

interface VideoPickerPanelProps {
  selectedDimension: RentfrowDimension;
  onSelectDimension: (dim: RentfrowDimension) => void;
  onQueueVideo: (video: Video) => void;
  queuedCount: number;
  videos: Video[];
}

export function VideoPickerPanel({
  selectedDimension,
  onSelectDimension,
  onQueueVideo,
  queuedCount,
  videos,
}: VideoPickerPanelProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const videosByDim = getVideosByDimension(videos, selectedDimension);
  const dimInfo = DIMENSION_LABELS[selectedDimension];

  const handleQueueRandom = () => {
    // Pick from least-explored dimension (in demo, just random)
    const randomDim = DIMENSIONS[Math.floor(Math.random() * DIMENSIONS.length)];
    const pool = getVideosByDimension(videos, randomDim);
    if (pool.length > 0) {
      onQueueVideo(pool[Math.floor(Math.random() * pool.length)]);
    }
  };

  return (
    <div>
      <h3 className="text-xs text-gray-500 tracking-widest mb-2">
        VIDEO PICKER
      </h3>
      <div className="border border-gray-800 bg-black/50 p-4">
        {/* Dimension selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {DIMENSIONS.map((dim) => {
            const info = DIMENSION_LABELS[dim];
            const isSelected = dim === selectedDimension;
            return (
              <button
                key={dim}
                onClick={() => onSelectDimension(dim)}
                className={`px-3 py-1.5 text-xs tracking-wider border transition-all shrink-0 ${
                  isSelected
                    ? "border-current bg-current/10"
                    : "border-gray-800 text-gray-500 hover:border-gray-600"
                }`}
                style={isSelected ? { color: info.color } : {}}
              >
                {info.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-xs mb-3">{dimInfo.description}</p>

        {/* Video grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
          {videosByDim.map((video) => (
            <button
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className={`relative border p-2 text-left transition-all group ${
                selectedVideo?.id === video.id
                  ? "border-accent bg-accent/5"
                  : "border-gray-800 hover:border-gray-600"
              }`}
            >
              {/* Thumbnail placeholder */}
              <div className="aspect-video bg-gray-900 mb-2 flex items-center justify-center text-gray-700">
                <svg
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400 leading-tight truncate">
                {video.title}
              </p>
              <p className="text-[9px] text-gray-600 mt-0.5">
                {video.duration_seconds
                  ? `${Math.floor(video.duration_seconds / 60)}:${(
                      video.duration_seconds % 60
                    )
                      .toString()
                      .padStart(2, "0")}`
                  : ""}
              </p>

              {/* Attribute pills */}
              <div className="flex gap-1 mt-1 flex-wrap">
                {video.attr_pace && (
                  <span className="text-[8px] px-1 bg-gray-900 text-gray-500">
                    {video.attr_pace}
                  </span>
                )}
                {video.attr_valence && (
                  <span className="text-[8px] px-1 bg-gray-900 text-gray-500">
                    {video.attr_valence}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (selectedVideo) {
                onQueueVideo(selectedVideo);
                setSelectedVideo(null);
              }
            }}
            disabled={!selectedVideo}
            className={`flex-1 py-2 text-xs tracking-widest font-bold transition-all ${
              selectedVideo
                ? "bg-accent text-black hover:bg-accent/80"
                : "bg-gray-900 text-gray-600 cursor-not-allowed"
            }`}
          >
            QUEUE SELECTED
          </button>
          <button
            onClick={handleQueueRandom}
            className="flex-1 py-2 text-xs tracking-widest font-bold border border-gray-700 text-gray-400 hover:border-accent hover:text-accent transition-all"
          >
            QUEUE RANDOM
          </button>
        </div>
      </div>
    </div>
  );
}
