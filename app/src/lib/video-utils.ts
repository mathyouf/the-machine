import { RentfrowDimension, Video } from "./supabase/types";

export const DIMENSIONS: RentfrowDimension[] = [
  "communal",
  "aesthetic",
  "dark",
  "thrilling",
  "cerebral",
];

export function getVideosByDimension(
  videos: Video[],
  dim: RentfrowDimension
): Video[] {
  const key = `dim_${dim}` as keyof Video;
  return videos
    .filter((video) => (video[key] as number) >= 0.6)
    .sort((a, b) => (b[key] as number) - (a[key] as number));
}

export function buildSystemDefaultQueue(videos: Video[]): Video[] {
  const dims: RentfrowDimension[] = [
    "cerebral",
    "thrilling",
    "aesthetic",
    "communal",
    "dark",
    "cerebral",
    "aesthetic",
    "thrilling",
    "communal",
    "dark",
  ];

  if (videos.length === 0) return [];

  return dims.map((dim) => {
    const pool = getVideosByDimension(videos, dim);
    if (pool.length === 0) {
      return videos[Math.floor(Math.random() * videos.length)];
    }
    return pool[Math.floor(Math.random() * pool.length)];
  });
}

export function getPrimaryDimension(video: Video): RentfrowDimension {
  const entries: [RentfrowDimension, number][] = [
    ["communal", video.dim_communal],
    ["aesthetic", video.dim_aesthetic],
    ["dark", video.dim_dark],
    ["thrilling", video.dim_thrilling],
    ["cerebral", video.dim_cerebral],
  ];
  return entries.sort(([, a], [, b]) => b - a)[0]?.[0] ?? "communal";
}
