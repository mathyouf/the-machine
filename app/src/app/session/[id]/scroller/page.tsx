"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { VideoFeed } from "@/components/scroller/VideoFeed";
import { useCameraCapture } from "@/components/scroller/CameraCapture";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import { buildSystemDefaultQueue } from "@/lib/video-utils";
import { createSessionChannel } from "@/lib/supabase/realtime";
import { fetchVideos, insertScrollEvent, upsertUserProfile } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isUuid } from "@/lib/supabase/utils";
import { Video } from "@/lib/supabase/types";
import { ensureAnonSession } from "@/lib/supabase/auth";

export default function ScrollerPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "demo";
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const useSupabase = isSupabaseConfigured && authReady && isUuid(sessionId);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pendingTextCard, setPendingTextCard] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(true);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof createSessionChannel> | null>(null);
  const optimizerQueuedIdsRef = useRef<Set<string>>(new Set());
  const videosRef = useRef<Video[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    ensureAnonSession()
      .then(() => upsertUserProfile())
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(false));
  }, []);

  useEffect(() => {
    fetchVideos({ fallbackToDemo: !useSupabase }).then((allVideos) => {
      if (allVideos.length === 0) {
        if (!useSupabase) setVideos(DEMO_VIDEOS);
        return;
      }
      const systemQueue = buildSystemDefaultQueue(allVideos);
      const remaining = allVideos.filter(
        (video) => !systemQueue.find((sq) => sq.id === video.id)
      );
      setVideos([...systemQueue, ...remaining]);
    });
  }, [useSupabase]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Camera capture for sending frames to Optimizer
  useCameraCapture({
    onFrame: (base64) => {
      if (!useSupabase) return;
      channelRef.current?.broadcast({
        type: "camera_frame",
        frame: base64,
        timestamp: Date.now(),
      });
    },
    intervalMs: 2500,
    enabled: sessionActive && cameraAllowed,
  });

  // Set session start time for demo mode
  useEffect(() => {
    if (!useSupabase && sessionStartTime === null) {
      const t = setTimeout(() => setSessionStartTime(Date.now()), 0);
      return () => clearTimeout(t);
    }
  }, [useSupabase, sessionStartTime]);

  // Simulate receiving text cards from optimizer (demo mode)
  useEffect(() => {
    if (useSupabase) return;
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
  }, [sessionActive, useSupabase]);

  useEffect(() => {
    if (!useSupabase) return;

    const channel = createSessionChannel(sessionId);
    channelRef.current = channel;

    const unsubscribe = channel.subscribe((event) => {
      if (event.type === "text_card") {
        setPendingTextCard(event.content);
      }

      if (event.type === "queue_video") {
        const queued = videosRef.current.find(
          (video) => video.id === event.video_id
        );
        if (queued) {
          optimizerQueuedIdsRef.current.add(queued.id);
          setVideos((prev) => {
            if (prev.find((v) => v.id === queued.id)) return prev;
            return [...prev, queued];
          });
        }
      }

      if (event.type === "session_start") {
        setSessionStartTime(event.timestamp);
      }

      if (event.type === "session_end") {
        setSessionActive(false);
      }
    });

    const now = Date.now();
    channel.broadcast({ type: "session_start", timestamp: now });
    const t = setTimeout(() => setSessionStartTime(now), 0);

    return () => {
      clearTimeout(t);
      unsubscribe();
      channel.unsubscribe();
    };
  }, [sessionId, useSupabase]);

  const handleDwellEvent = useCallback(
    (videoId: string, dwellMs: number, scrollVelocity: number) => {
      const queuedBy = optimizerQueuedIdsRef.current.has(videoId)
        ? "optimizer"
        : "system";
      const timestampMs =
        sessionStartTime !== null ? Date.now() - sessionStartTime : 0;

      if (useSupabase) {
        channelRef.current?.broadcast({
          type: "scroll_event",
          video_id: videoId,
          dwell_ms: dwellMs,
          scroll_velocity: scrollVelocity,
          queued_by: queuedBy,
          timestamp_ms: timestampMs,
        });

        insertScrollEvent({
          session_id: sessionId,
          video_id: videoId,
          dwell_ms: dwellMs,
          scroll_velocity: scrollVelocity,
          queued_by: queuedBy,
          timestamp_ms: timestampMs,
          info_gain: null,
          cumulative_info: null,
        });
      }
    },
    [sessionId, sessionStartTime, useSupabase]
  );

  const handleEndSession = useCallback(() => {
    setSessionActive(false);
    if (useSupabase) {
      channelRef.current?.broadcast({
        type: "session_end",
        timestamp: Date.now(),
      });
    }
    window.location.href = `/session/${sessionId}/reveal`;
  }, [sessionId, useSupabase]);

  return (
    <>
      <VideoFeed
        videos={videos}
        onDwellEvent={handleDwellEvent}
        pendingTextCard={pendingTextCard}
        onTextCardDismissed={() => setPendingTextCard(null)}
        sessionActive={sessionActive}
        sessionStartTime={sessionStartTime ?? undefined}
        onEndSession={handleEndSession}
      />
      {showConsent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-6">
          <div className="max-w-md w-full border border-gray-800 bg-black/90 p-6 text-center">
            <p className="text-xs text-gray-600 tracking-[0.3em] mb-4">
              CAMERA CONSENT
            </p>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your camera feed is sent as low-res snapshots to the Optimizer
              during this session. It is not stored.
            </p>
            {cameraError && (
              <p className="text-xs text-red-400 mb-4">{cameraError}</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setCameraError(null);
                  setCameraAllowed(true);
                  setShowConsent(false);
                }}
                className="w-full py-2 bg-accent text-black font-bold tracking-widest text-xs hover:bg-accent/80 transition-all"
              >
                ALLOW CAMERA
              </button>
              <button
                onClick={() => {
                  setCameraAllowed(false);
                  setShowConsent(false);
                }}
                className="w-full py-2 border border-gray-800 text-gray-500 text-xs tracking-widest hover:border-gray-600 hover:text-gray-300 transition-all"
              >
                CONTINUE WITHOUT CAMERA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
