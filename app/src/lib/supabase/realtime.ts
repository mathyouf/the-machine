import { supabase, isSupabaseConfigured } from "./client";
import { RealtimeEvent } from "./types";
import { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting" | "error";

export interface SessionChannel {
  subscribe: (callback: (event: RealtimeEvent) => void) => () => void;
  broadcast: (event: RealtimeEvent) => void;
  unsubscribe: () => void;
  onStatusChange: (callback: (status: ConnectionStatus, error?: string) => void) => void;
  getStatus: () => ConnectionStatus;
}

/**
 * Create a Realtime channel for a session with auto-reconnect and status tracking.
 */
export function createSessionChannel(sessionId: string): SessionChannel {
  if (!isSupabaseConfigured) {
    // Demo mode — no Supabase connection
    let statusCb: ((status: ConnectionStatus, error?: string) => void) | null = null;
    return {
      subscribe: (callback: (event: RealtimeEvent) => void) => {
        console.log(`[Demo] Subscribed to session:${sessionId}`);
        statusCb?.("connected");
        return () => console.log(`[Demo] Unsubscribed from session:${sessionId}`);
      },
      broadcast: (event: RealtimeEvent) => {
        console.log(`[Demo] Broadcast on session:${sessionId}:`, event);
      },
      unsubscribe: () => {
        console.log(`[Demo] Channel closed for session:${sessionId}`);
      },
      onStatusChange: (cb) => { statusCb = cb; },
      getStatus: () => "connected",
    };
  }

  // Production mode — use Supabase Realtime with reconnect
  let channel: RealtimeChannel | null = null;
  let status: ConnectionStatus = "connecting";
  let statusCallback: ((status: ConnectionStatus, error?: string) => void) | null = null;
  let eventCallback: ((event: RealtimeEvent) => void) | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;
  let destroyed = false;
  const MAX_RECONNECT_ATTEMPTS = 10;
  const BASE_RECONNECT_DELAY = 1000;
  const MAX_RECONNECT_DELAY = 30000;

  function setStatus(newStatus: ConnectionStatus, error?: string) {
    status = newStatus;
    statusCallback?.(newStatus, error);
  }

  function getReconnectDelay(): number {
    // Exponential backoff with jitter
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts),
      MAX_RECONNECT_DELAY
    );
    return delay + Math.random() * 1000;
  }

  function setupChannel() {
    if (destroyed) return;

    channel = supabase.channel(`session:${sessionId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "session_event" }, (payload) => {
        eventCallback?.(payload.payload as RealtimeEvent);
      })
      .subscribe((subscriptionStatus) => {
        if (destroyed) return;

        switch (subscriptionStatus) {
          case "SUBSCRIBED":
            reconnectAttempts = 0;
            setStatus("connected");
            break;
          case "TIMED_OUT":
            setStatus("reconnecting", "Connection timed out");
            scheduleReconnect();
            break;
          case "CLOSED":
            if (!destroyed) {
              setStatus("disconnected", "Channel closed");
              scheduleReconnect();
            }
            break;
          case "CHANNEL_ERROR":
            setStatus("error", "Channel error");
            scheduleReconnect();
            break;
        }
      });
  }

  function scheduleReconnect() {
    if (destroyed || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        setStatus("error", `Failed after ${MAX_RECONNECT_ATTEMPTS} reconnect attempts`);
      }
      return;
    }

    reconnectAttempts++;
    const delay = getReconnectDelay();
    setStatus("reconnecting", `Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

    reconnectTimer = setTimeout(() => {
      if (destroyed) return;
      // Clean up old channel
      if (channel) {
        try { channel.unsubscribe(); } catch {}
      }
      setupChannel();
    }, delay);
  }

  function cleanup() {
    destroyed = true;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (channel) {
      try { channel.unsubscribe(); } catch {}
      channel = null;
    }
  }

  return {
    subscribe: (callback: (event: RealtimeEvent) => void) => {
      eventCallback = callback;
      setupChannel();
      return () => {
        eventCallback = null;
        cleanup();
      };
    },
    broadcast: (event: RealtimeEvent) => {
      if (!channel) return;
      channel.send({
        type: "broadcast",
        event: "session_event",
        payload: event,
      });
    },
    unsubscribe: () => {
      cleanup();
    },
    onStatusChange: (cb) => {
      statusCallback = cb;
    },
    getStatus: () => status,
  };
}
