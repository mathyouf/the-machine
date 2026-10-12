"use client";

import { useState, useEffect } from "react";
import { ConnectionStatus } from "@/lib/supabase/realtime";

interface ConnectionStatusProps {
  status: ConnectionStatus;
  error?: string | null;
}

export function ConnectionStatusBanner({ status, error }: ConnectionStatusProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status === "connected") {
      // Show briefly on reconnect success, then hide
      if (visible) {
        const timer = setTimeout(() => setVisible(false), 2000);
        return () => clearTimeout(timer);
      }
      return;
    }
    if (status !== "connecting") {
      setVisible(true);
      setDismissed(false);
    }
  }, [status, visible]);

  if (!visible || dismissed || status === "connecting") return null;

  const configs: Record<string, { bg: string; text: string; label: string; animate?: boolean }> = {
    connected: { bg: "bg-green-500/10 border-green-500/30", text: "text-green-400", label: "Reconnected" },
    disconnected: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400", label: "Disconnected", animate: true },
    reconnecting: { bg: "bg-yellow-500/10 border-yellow-500/30", text: "text-yellow-400", label: "Reconnecting...", animate: true },
    error: { bg: "bg-red-500/10 border-red-500/30", text: "text-red-400", label: "Connection lost" },
  };

  const config = configs[status] ?? configs.error;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] border-b ${config.bg} px-4 py-2 flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {config.animate && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
        <span className={`text-xs tracking-widest ${config.text}`}>
          {config.label}
        </span>
        {error && (
          <span className="text-xs text-gray-500 ml-2">{error}</span>
        )}
      </div>
      {status === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 px-2 py-0.5 tracking-widest"
        >
          RELOAD
        </button>
      )}
    </div>
  );
}
