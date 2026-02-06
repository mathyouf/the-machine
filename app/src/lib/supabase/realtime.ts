import { supabase, isSupabaseConfigured } from "./client";
import { RealtimeEvent } from "./types";

/**
 * Create a Realtime channel for a session.
 * In demo mode (no Supabase configured), this returns stub functions
 * that log to console instead of broadcasting.
 */
export function createSessionChannel(sessionId: string) {
  if (!isSupabaseConfigured) {
    // Demo mode — no Supabase connection
    return {
      subscribe: (_callback: (event: RealtimeEvent) => void) => {
        console.log(`[Demo] Subscribed to session:${sessionId}`);
        return () => console.log(`[Demo] Unsubscribed from session:${sessionId}`);
      },
      broadcast: (event: RealtimeEvent) => {
        console.log(`[Demo] Broadcast on session:${sessionId}:`, event);
      },
      unsubscribe: () => {
        console.log(`[Demo] Channel closed for session:${sessionId}`);
      },
    };
  }

  // Production mode — use Supabase Realtime
  const channel = supabase.channel(`session:${sessionId}`);

  return {
    subscribe: (callback: (event: RealtimeEvent) => void) => {
      channel
        .on("broadcast", { event: "session_event" }, (payload) => {
          callback(payload.payload as RealtimeEvent);
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    },
    broadcast: (event: RealtimeEvent) => {
      channel.send({
        type: "broadcast",
        event: "session_event",
        payload: event,
      });
    },
    unsubscribe: () => {
      channel.unsubscribe();
    },
  };
}
