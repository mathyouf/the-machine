import { ScrollEvent, SessionSummary, Video } from "./types";
import { RentfrowDimension } from "./types";
import { getPrimaryDimension } from "../video-utils";

const DIMENSIONS: RentfrowDimension[] = [
  "communal",
  "aesthetic",
  "dark",
  "thrilling",
  "cerebral",
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function shannonEntropy(proportions: number[]) {
  const filtered = proportions.filter((p) => p > 0);
  return filtered.reduce((sum, p) => sum - p * Math.log2(p), 0);
}

export function buildSessionSummary(
  sessionId: string,
  scrollEvents: ScrollEvent[],
  videoMap: Map<string, Video>
): SessionSummary {
  const durationSeconds =
    scrollEvents.length > 0
      ? Math.floor(
          Math.max(...scrollEvents.map((e) => e.timestamp_ms)) / 1000
        )
      : 0;

  const optimizerEvents = scrollEvents.filter((e) => e.queued_by === "optimizer");
  const systemEvents = scrollEvents.filter((e) => e.queued_by === "system");

  const avgDwell = (events: ScrollEvent[]) =>
    events.length > 0
      ? events.reduce((sum, e) => sum + e.dwell_ms, 0) / events.length
      : 0;

  const avgOptDwell = avgDwell(optimizerEvents);
  const avgSysDwell = avgDwell(systemEvents);
  const engagementMultiplier = avgSysDwell > 0 ? avgOptDwell / avgSysDwell : 1;

  const dimensionCounts = DIMENSIONS.reduce((acc, dim) => {
    acc[dim] = 0;
    return acc;
  }, {} as Record<RentfrowDimension, number>);

  scrollEvents.forEach((event) => {
    const video = videoMap.get(event.video_id);
    if (!video) return;
    const dim = getPrimaryDimension(video);
    dimensionCounts[dim] += 1;
  });

  const dimensionsExplored = DIMENSIONS.filter(
    (dim) => dimensionCounts[dim] >= 3
  ).length;

  const totalEvents = scrollEvents.length || 1;
  const proportions = DIMENSIONS.map((dim) => dimensionCounts[dim] / totalEvents);
  const explorationEntropy = shannonEntropy(proportions);

  const totalDwell = scrollEvents.reduce((sum, e) => sum + e.dwell_ms, 0) || 1;
  const featureVector = DIMENSIONS.reduce((acc, dim) => {
    acc[dim] = 0;
    return acc;
  }, {} as Record<RentfrowDimension, number>);

  scrollEvents.forEach((event) => {
    const video = videoMap.get(event.video_id);
    if (!video) return;
    const weight = event.dwell_ms / totalDwell;
    featureVector.communal += video.dim_communal * weight;
    featureVector.aesthetic += video.dim_aesthetic * weight;
    featureVector.dark += video.dim_dark * weight;
    featureVector.thrilling += video.dim_thrilling * weight;
    featureVector.cerebral += video.dim_cerebral * weight;
  });

  const explorationMultiplier = 1 + 0.2 * (dimensionsExplored / 5);
  const optimizerScore = Math.floor(
    durationSeconds * engagementMultiplier * explorationMultiplier
  );

  const finalUmapCoords = {
    x: clamp01(
      0.5 +
        (featureVector.aesthetic +
          featureVector.thrilling -
          featureVector.communal -
          featureVector.dark) /
          4
    ),
    y: clamp01(
      0.5 +
        (featureVector.cerebral +
          featureVector.communal -
          featureVector.dark -
          featureVector.thrilling) /
          4
    ),
  };

  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    duration_seconds: durationSeconds,
    total_videos_shown: scrollEvents.length,
    optimizer_videos_shown: optimizerEvents.length,
    system_videos_shown: systemEvents.length,
    avg_dwell_optimizer_ms: optimizerEvents.length ? avgOptDwell : null,
    avg_dwell_system_ms: systemEvents.length ? avgSysDwell : null,
    engagement_multiplier: engagementMultiplier,
    total_info_gain: scrollEvents.reduce(
      (sum, e) => sum + (e.info_gain ?? 0),
      0
    ),
    dimensions_explored: dimensionsExplored,
    exploration_entropy: explorationEntropy,
    optimizer_score: optimizerScore,
    final_feature_vector: featureVector,
    final_umap_coords: finalUmapCoords,
    scroller_accepted_call: null,
    optimizer_accepted_call: null,
    call_duration_seconds: null,
    created_at: new Date().toISOString(),
  };
}
