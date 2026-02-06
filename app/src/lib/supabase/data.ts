import { supabase, isSupabaseConfigured } from "./client";
import {
  LeaderboardEntry,
  ScrollEvent,
  SessionStatus,
  SessionSummary,
  TextCard,
  Video,
} from "./types";
import { DEMO_VIDEOS } from "../demo-data";
import { getUserId } from "./auth";

export async function fetchVideos(options?: {
  fallbackToDemo?: boolean;
}): Promise<Video[]> {
  const fallbackToDemo = options?.fallbackToDemo ?? !isSupabaseConfigured;
  if (!isSupabaseConfigured) return DEMO_VIDEOS;
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("added_at", { ascending: false });
  if (error || !data || data.length === 0) return fallbackToDemo ? DEMO_VIDEOS : [];
  return data as Video[];
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("leaderboard").select("*");
  if (error || !data) return [];
  return data as LeaderboardEntry[];
}

export async function fetchTextCards(sessionId: string): Promise<TextCard[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("text_cards")
    .select("*")
    .eq("session_id", sessionId)
    .order("sent_at_ms", { ascending: true });
  if (error || !data) return [];
  return data as TextCard[];
}

export async function fetchScrollEvents(sessionId: string): Promise<ScrollEvent[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("scroll_events")
    .select("*")
    .eq("session_id", sessionId)
    .order("timestamp_ms", { ascending: true });
  if (error || !data) return [];
  return data as ScrollEvent[];
}

export async function fetchSessionSummary(
  sessionId: string
): Promise<SessionSummary | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("session_summaries")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return data as SessionSummary;
}

export async function insertScrollEvent(event: Omit<ScrollEvent, "id">) {
  if (!isSupabaseConfigured) return;
  await supabase.from("scroll_events").insert(event);
}

export async function insertTextCard(card: Omit<TextCard, "id" | "sent_at">) {
  if (!isSupabaseConfigured) return;
  await supabase.from("text_cards").insert({
    ...card,
    sent_at: new Date().toISOString(),
  });
}

export async function insertSessionSummary(summary: SessionSummary) {
  if (!isSupabaseConfigured) return;
  await supabase.from("session_summaries").upsert(summary, {
    onConflict: "session_id",
  });
}

export async function ensureSessionSlot(
  sessionId: string,
  status: SessionStatus
) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase
    .from("session_slots")
    .select("id")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || data) return;

  await supabase.from("session_slots").insert({
    id: sessionId,
    starts_at: new Date().toISOString(),
    status,
  });
}

export async function fetchSessionSlot(sessionId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("session_slots")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return data as {
    id: string;
    starts_at: string;
    optimizer_id: string | null;
    scroller_id: string | null;
    status: SessionStatus;
    created_at: string;
  };
}

export async function createSessionSlot(
  sessionId: string,
  role: "optimizer" | "scroller",
  status: SessionStatus
) {
  if (!isSupabaseConfigured) return null;
  const userId = await getUserId();
  if (!userId) return null;

  const payload =
    role === "optimizer"
      ? { optimizer_id: userId }
      : { scroller_id: userId };

  const { data, error } = await supabase
    .from("session_slots")
    .insert({
      id: sessionId,
      starts_at: new Date().toISOString(),
      status,
      ...payload,
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return data;
}

export async function assignSessionRole(
  sessionId: string,
  role: "optimizer" | "scroller"
) {
  if (!isSupabaseConfigured) return null;
  const userId = await getUserId();
  if (!userId) return null;
  const payload =
    role === "optimizer"
      ? { optimizer_id: userId }
      : { scroller_id: userId };
  const { data, error } = await supabase
    .from("session_slots")
    .update(payload)
    .eq("id", sessionId)
    .select("*")
    .single();
  if (error || !data) return null;
  return data;
}

export async function upsertUserProfile() {
  if (!isSupabaseConfigured) return;
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("users").upsert(
    {
      id: userId,
      google_id: null,
      display_name: null,
      avatar_url: null,
      email: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}
