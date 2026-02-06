"use client";

import { useState, useCallback, useEffect } from "react";
import { VideoFeed } from "@/components/scroller/VideoFeed";
import { useCameraCapture } from "@/components/scroller/CameraCapture";
import { DEMO_VIDEOS, getSystemDefaultQueue } from "@/lib/demo-data";

export default function ScrollerPage() {
  const [videos] = useState(() => {
    // Start with system default queue, then add remaining videos
    const systemQueue = getSystemDefaultQueue();
    const remaining = DEMO_VIDEOS.filter(
      (v) => !systemQueue.find((sq) => sq.id === v.id)
    );
    return [...systemQueue, ...remaining];
  });
  const [sessionStartTime] = useState(Date.now());
  const [pendingTextCard, setPendingTextCard] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(true);

  // Camera capture for sending frames to Optimizer
  useCameraCapture({
    onFrame: (base64) => {
      // In production: broadcast via Supabase Realtime channel
      // supabase.channel(`session:${sessionId}`).send({ type: 'camera_frame', frame: base64 })
    },
    intervalMs: 2500,
    enabled: sessionActive,
  });

  // Simulate receiving text cards from optimizer (demo mode)
  useEffect(() => {
    const demoCards = [
      { delay: 15000, text: "We noticed you paused on that one." },
      { delay: 35000, text: "Interesting." },
      { delay: 60000, text: "You might like this next." },
      { delay: 90000, text: "What if we tried something different?" },
    ];

    const timers = demoCards.map(({ delay, text }) =>
      setTimeout(() => {
        if (sessionActive) setPendingTextCard(text);
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [sessionActive]);

  const handleDwellEvent = useCallback(
    (videoId: string, dwellMs: number, scrollVelocity: number) => {
      // In production: insert into scroll_events table + broadcast via Realtime
      console.log("Scroll event:", { videoId, dwellMs, scrollVelocity });
    },
    []
  );

  const handleEndSession = useCallback(() => {
    setSessionActive(false);
    // In production: broadcast session_end event, transition to REVEAL state
    window.location.href = `/session/demo/reveal`;
  }, []);

  return (
    <VideoFeed
      videos={videos}
      onDwellEvent={handleDwellEvent}
      pendingTextCard={pendingTextCard}
      onTextCardDismissed={() => setPendingTextCard(null)}
      sessionActive={sessionActive}
      sessionStartTime={sessionStartTime}
      onEndSession={handleEndSession}
    />
  );
}
