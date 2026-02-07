"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { VideoFeed } from "@/components/scroller/VideoFeed";
import { useCameraCapture } from "@/components/scroller/CameraCapture";
import { DEMO_VIDEOS } from "@/lib/demo-data";
import { buildSystemDefaultQueue } from "@/lib/video-utils";
import { createSessionChannel } from "@/lib/supabase/realtime";
import { fetchVideos, insertScrollEvent, updateSessionStatus, upsertUserProfile } from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isUuid } from "@/lib/supabase/utils";
import { Video } from "@/lib/supabase/types";
import { ConnectionStatus } from "@/lib/supabase/realtime";
import { ensureAnonSession } from "@/lib/supabase/auth";
import { ConnectionStatusBanner } from "@/components/shared/ConnectionStatus";
import { scrollEventLimiter, cameraFrameLimiter } from "@/lib/rate-limit";

export default function ScrollerPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "demo";
  const [authReady, setAuthReady] = useState(false);
  const useSupabase = isSupabaseConfigured && authReady && isUuid(sessionId);
  const [videos, setVideos] = useState<Video[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pendingTextCard, setPendingTextCard] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(true);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [showConsent, setShowConsent] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("connecting");
  const [connError, setConnError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof createSessionChannel> | null>(null);
  const optimizerQueuedIdsRef = useRef<Set<string>>(new Set());
  const videosRef = useRef<Video[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }
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
      if (!cameraFrameLimiter.tryProceed()) return;
      channelRef.current?.broadcast({
        type: "camera_frame",
        frame: base64,
        timestamp: Date.now(),
      });
    },
    intervalMs: 2500,
    enabled: sessionActive && cameraAllowed,
  });

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
    if (!useSupabase) {
      setSessionStartTime(Date.now());
      return;
    }

    const channel = createSessionChannel(sessionId);
    channelRef.current = channel;
    channel.onStatusChange((status, error) => {
      setConnStatus(status);
      setConnError(error ?? null);
    });

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

    channel.broadcast({ type: "session_start", timestamp: Date.now() });
    setSessionStartTime(Date.now());
    updateSessionStatus(sessionId, "active");

    return () => {
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

      if (useSupabase && scrollEventLimiter.tryProceed()) {
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
      <ConnectionStatusBanner status={connStatus} error={connError} />
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
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Your camera feed is sent as low-res snapshots (320×240) to the
              Optimizer during this session so they can read your reactions.
            </p>
            <div className="border border-gray-800 bg-gray-900/50 p-3 mb-4 text-left space-y-2">
              <p className="text-xs text-accent tracking-widest">DATA POLICY</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
                <li>Snapshots are sent peer-to-peer via Supabase Realtime broadcast</li>
                <li>Frames are <strong className="text-gray-400">never stored</strong> on any server or database</li>
                <li>Only your session partner sees the feed, in real-time only</li>
                <li>Camera stops immediately when the session ends</li>
                <li>You can revoke access anytime by refreshing the page</li>
              </ul>
            </div>
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
                I UNDERSTAND — ALLOW CAMERA
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
              <p className="text-[10px] text-gray-700 mt-1">
                The experience works without camera, but the Optimizer won&apos;t see your reactions.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
