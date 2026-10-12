// Database types matching the engineering plan schema (Section 5)

export type SessionStatus =
  | "open"
  | "matched"
  | "lobby"
  | "active"
  | "reveal"
  | "call"
  | "completed"
  | "abandoned";

export type RentfrowDimension =
  | "communal"
  | "aesthetic"
  | "dark"
  | "thrilling"
  | "cerebral";

export type Pace = "slow" | "medium" | "fast";
export type Valence = "warm" | "neutral" | "dark";
export type Complexity = "simple" | "moderate" | "complex";
export type SocialDensity = "solo" | "small_group" | "crowd";
export type Novelty = "familiar" | "moderate" | "strange";
export type Production = "raw" | "moderate" | "polished";
export type QueuedBy = "system" | "optimizer";
export type Role = "optimizer" | "scroller";
export type TrendIndicator = "ENGAGED" | "NEUTRAL" | "LOSING THEM";

export interface User {
  id: string;
  google_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
}

export interface SessionSlot {
  id: string;
  starts_at: string;
  optimizer_id: string | null;
  scroller_id: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface Video {
  id: string;
  youtube_id: string;
  title: string | null;
  duration_seconds: number | null;
  dim_communal: number;
  dim_aesthetic: number;
  dim_dark: number;
  dim_thrilling: number;
  dim_cerebral: number;
  attr_pace: Pace | null;
  attr_valence: Valence | null;
  attr_complexity: Complexity | null;
  attr_social_density: SocialDensity | null;
  attr_novelty: Novelty | null;
  attr_production: Production | null;
  diag_openness: number;
  diag_conscientiousness: number;
  diag_extraversion: number;
  diag_agreeableness: number;
  diag_neuroticism: number;
  added_at: string;
}

export interface ScrollEvent {
  id: number;
  session_id: string;
  video_id: string;
  dwell_ms: number;
  scroll_velocity: number | null;
  queued_by: QueuedBy;
  timestamp_ms: number;
  info_gain: number | null;
  cumulative_info: number | null;
}

export interface TextCard {
  id: string;
  session_id: string;
  content: string;
  sent_at_ms: number;
  sent_at: string;
}

export interface SessionSummary {
  id: string;
  session_id: string;
  duration_seconds: number;
  total_videos_shown: number;
  optimizer_videos_shown: number;
  system_videos_shown: number;
  avg_dwell_optimizer_ms: number | null;
  avg_dwell_system_ms: number | null;
  engagement_multiplier: number | null;
  total_info_gain: number | null;
  dimensions_explored: number | null;
  exploration_entropy: number | null;
  optimizer_score: number;
  final_feature_vector: Record<string, number>;
  final_umap_coords: { x: number; y: number };
  scroller_accepted_call: boolean | null;
  optimizer_accepted_call: boolean | null;
  call_duration_seconds: number | null;
  created_at: string;
}

export interface FieldReport {
  id: string;
  session_id: string;
  user_id: string;
  role: Role;
  content: string;
  share_consent: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  sessions_played: number;
  best_score: number;
  avg_score: number;
  avg_retention_seconds: number;
  avg_info_gain: number;
}

// Realtime event types
export interface RealtimeScrollEvent {
  type: "scroll_event";
  video_id: string;
  dwell_ms: number;
  scroll_velocity: number | null;
  queued_by: QueuedBy;
  timestamp_ms: number;
}

export interface RealtimeVideoQueue {
  type: "queue_video";
  video_id: string;
}

export interface RealtimeTextCard {
  type: "text_card";
  content: string;
  sent_at_ms: number;
}

export interface RealtimeCameraFrame {
  type: "camera_frame";
  frame: string; // base64 JPEG
  timestamp: number;
}

export interface RealtimeSessionControl {
  type: "session_start" | "session_end" | "countdown";
  timestamp: number;
  countdown?: number;
}

export type RealtimeEvent =
  | RealtimeScrollEvent
  | RealtimeVideoQueue
  | RealtimeTextCard
  | RealtimeCameraFrame
  | RealtimeSessionControl;
