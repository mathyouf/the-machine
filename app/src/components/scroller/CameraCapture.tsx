"use client";

import { useEffect, useRef, useCallback } from "react";

interface CameraCaptureProps {
  onFrame?: (base64Jpeg: string) => void;
  intervalMs?: number;
  enabled?: boolean;
}

export function useCameraCapture({
  onFrame,
  intervalMs = 2500,
  enabled = true,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !onFrame) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    const jpeg = canvas.toDataURL("image/jpeg", 0.6);
    onFrame(jpeg);
  }, [onFrame]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;

      // Attach to the video element in the scroller UI
      const videoEl = document.getElementById(
        "scroller-camera"
      ) as HTMLVideoElement;
      if (videoEl) {
        videoEl.srcObject = stream;
      }

      // Create hidden elements for capture
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;

      const canvas = document.createElement("canvas");
      canvasRef.current = canvas;

      // Start capture interval
      intervalRef.current = setInterval(captureFrame, intervalMs);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
    }
  }, [captureFrame, intervalMs]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      startCamera();
    }
    return () => stopCamera();
  }, [enabled, startCamera, stopCamera]);

  return { startCamera, stopCamera };
}
