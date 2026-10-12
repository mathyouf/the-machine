"use client";

import { useEffect, useRef } from "react";
import { RentfrowDimension } from "@/lib/supabase/types";
import { DIMENSION_LABELS } from "@/lib/demo-data";

interface UmapPoint {
  x: number;
  y: number;
  dwellMs: number;
  dimension: RentfrowDimension;
  timestamp: number;
}

interface UmapVisualizationProps {
  points: UmapPoint[];
  width?: number;
  height?: number;
  animated?: boolean;
  showTrail?: boolean;
  className?: string;
}

export function UmapVisualization({
  points,
  width = 300,
  height = 300,
  animated = false,
  showTrail = true,
  className = "",
}: UmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const visibleCountRef = useRef(animated ? 0 : points.length);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const visible = points.slice(0, visibleCountRef.current);

      // Draw trail
      if (showTrail && visible.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 255, 136, 0.15)";
        ctx.lineWidth = 1;
        visible.forEach((p, i) => {
          const px = p.x * (width - 40) + 20;
          const py = p.y * (height - 40) + 20;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      // Draw points
      visible.forEach((p, i) => {
        const px = p.x * (width - 40) + 20;
        const py = p.y * (height - 40) + 20;
        const color = DIMENSION_LABELS[p.dimension]?.color ?? "#00ff88";
        const isLatest = i === visible.length - 1;

        // Dwell-based size: longer dwell = bigger dot
        const radius = Math.min(3 + (p.dwellMs / 2000), 8);

        // Glow on latest
        if (isLatest) {
          ctx.beginPath();
          ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = color + "33";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isLatest ? color : color + "88";
        ctx.fill();
      });

      // Axis labels
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
    };

    if (animated && visibleCountRef.current < points.length) {
      const animate = () => {
        if (visibleCountRef.current < points.length) {
          visibleCountRef.current++;
          draw();
          animFrameRef.current = requestAnimationFrame(() => {
            setTimeout(animate, 150);
          });
        }
      };
      animate();
    } else {
      visibleCountRef.current = points.length;
      draw();
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [points, width, height, animated, showTrail]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`bg-black/50 border border-gray-800 ${className}`}
    />
  );
}

// Generate demo UMAP points from a feature vector
export function generateDemoUmapPoints(
  featureVector: Record<string, number>,
  count: number = 22
): UmapPoint[] {
  const dims: RentfrowDimension[] = [
    "communal",
    "aesthetic",
    "dark",
    "thrilling",
    "cerebral",
  ];
  const points: UmapPoint[] = [];
  let cx = 0.5;
  let cy = 0.5;

  for (let i = 0; i < count; i++) {
    const dim = dims[i % dims.length];
    const preference = featureVector[dim] ?? 0.5;

    // Random walk biased by preferences
    cx += (Math.random() - 0.5) * 0.15 + (preference - 0.5) * 0.05;
    cy += (Math.random() - 0.5) * 0.15 + (preference - 0.5) * 0.03;
    cx = Math.max(0.05, Math.min(0.95, cx));
    cy = Math.max(0.05, Math.min(0.95, cy));

    points.push({
      x: cx,
      y: cy,
      dwellMs: 2000 + Math.random() * 10000 * preference,
      dimension: dim,
      timestamp: i * 30000,
    });
  }

  return points;
}
