"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  assignSessionRole,
  fetchSessionSlot,
  findOrCreateSession,
  upsertUserProfile,
} from "@/lib/supabase/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { ensureAnonSession, ensureAuthSession } from "@/lib/supabase/auth";
import { isUuid } from "@/lib/supabase/utils";
import { AuthModal } from "@/components/auth/AuthModal";

type LobbyState =
  | "auth_required"
  | "role_selection"
  | "checking_permissions"
  | "searching"
  | "waiting_for_partner"
  | "partner_joined"
  | "countdown"
  | "error";

export default function LobbyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rawSessionId = params?.id ?? "demo";
  const useSupabase = isSupabaseConfigured && rawSessionId !== "demo";
  const isValidSessionId = useMemo(() => isUuid(rawSessionId), [rawSessionId]);
  // "new" or non-UUID = auto-matchmaking flow; UUID = direct link join
  const isAutoMatch = useSupabase && !isValidSessionId;
  const [state, setState] = useState<LobbyState>(useSupabase ? "auth_required" : "role_selection");
  const [countdown, setCountdown] = useState(3);
  const [role, setRole] = useState<"optimizer" | "scroller">("scroller");
  const [sessionId, setSessionId] = useState<string>("demo");
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!useSupabase) return;

    const checkAuth = async () => {
      const session = await ensureAuthSession();
      if (!session) {
        setState("auth_required");
        setShowAuthModal(true);
      } else {
        setState("role_selection");
      }
    };

    checkAuth();
  }, [useSupabase]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setState("role_selection");
  };

  // Auto-matchmaking: user picks role, RPC finds or creates session
  const handleRoleSelected = async (chosenRole: "optimizer" | "scroller") => {
    setRole(chosenRole);

    if (!useSupabase) {
      // Demo flow
      setState("searching");
      setTimeout(() => setState("waiting_for_partner"), 1500);
      setTimeout(() => setState("partner_joined"), 4000);
      setTimeout(() => setState("countdown"), 5500);
      return;
    }

    setState("searching");

    try {
      // Verify auth session exists
      const session = await ensureAuthSession();
      if (!session) {
        setState("auth_required");
        setShowAuthModal(true);
        return;
      }

      await upsertUserProfile();

      if (isAutoMatch) {
        // Auto-matchmaking via RPC
        const result = await findOrCreateSession(chosenRole);
        if (!result) throw new Error("Matchmaking failed.");

        setSessionId(result.session_id);

        if (result.matched) {
          // Immediately matched!
          setState("partner_joined");
          setTimeout(() => setState("countdown"), 1500);
        } else {
          // Waiting for a partner \u2014 subscribe to changes
          setState("waiting_for_partner");
        }
      } else {
        // Direct link join \u2014 join existing session
        const id = rawSessionId;
        setSessionId(id);

        const existing = await fetchSessionSlot(id);
        if (!existing) {
          setState("error");
          setError("Session not found.");
          return;
        }

        if (!existing.optimizer_id) {
          setRole("optimizer");
          await assignSessionRole(id, "optimizer");
        } else if (!existing.scroller_id) {
          setRole("scroller");
          await assignSessionRole(id, "scroller");
        } else {
          setState("error");
          setError("This session is full.");
          return;
        }

        // Both roles now filled
        setState("partner_joined");
        setTimeout(() => setState("countdown"), 1500);
      }
    } catch (err) {
      console.error(err);
      setState("error");
      setError("Something went wrong. Please refresh and try again.");
    }
  };

  // Direct link join: auto-detect and skip role selection
  useEffect(() => {
    if (!useSupabase || isAutoMatch) return;
    // This is a UUID link \u2014 the user is joining a specific session
    // They still pick a role, but we can pre-check the session
    let active = true;

    const init = async () => {
      try {
        const session = await ensureAuthSession();
        if (!session) {
          setState("auth_required");
          setShowAuthModal(true);
          return;
        }

        await upsertUserProfile();

        const existing = await fetchSessionSlot(rawSessionId);
        if (!active) return;

        if (!existing) {
          setState("error");
          setError("Session not found. Ask for a new link.");
          return;
        }

        if (existing.optimizer_id && existing.scroller_id) {
          setState("error");
          setError("This session is full.");
          return;
        }

        // Auto-assign the available role
        const availableRole = !existing.optimizer_id ? "optimizer" : "scroller";
        setRole(availableRole);
        setSessionId(rawSessionId);

        // Immediately join
        await assignSessionRole(rawSessionId, availableRole);
        if (!active) return;

        setState("partner_joined");
        setTimeout(() => setState("countdown"), 1500);
      } catch (err) {
        console.error(err);
        if (active) {
          setState("error");
          setError("Unable to join session. Please refresh.");
        }
      }
    };

    init();
    return () => {
      active = false;
    };
  }, [isValidSessionId, rawSessionId, useSupabase, isAutoMatch]);

  // Subscribe to session_slots changes when waiting for a partner
  useEffect(() => {
    if (!useSupabase || !sessionId || !isUuid(sessionId)) return;
    if (state !== "waiting_for_partner") return;

    const channel = supabase
      .channel(`session_slot:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_slots",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const next = payload.new as {
            optimizer_id: string | null;
            scroller_id: string | null;
          };
          if (next.optimizer_id && next.scroller_id) {
            setState("partner_joined");
            setTimeout(() => setState("countdown"), 1500);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, useSupabase, state]);

  // Demo flow simulation
  useEffect(() => {
    if (useSupabase) return;
    if (state !== "searching") return;
    setSessionId("demo");
  }, [state, useSupabase]);

  // Countdown timer
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      router.push(`/session/${sessionId}/${role}`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, router, role, sessionId]);

  return (
    <>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6 sacred-geometry-bg">
        {/* Sacred geometry background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <svg viewBox="0 0 400 400" className="w-[500px] h-[500px]">
          <circle
            cx="200"
            cy="200"
            r="180"
            fill="none"
            stroke="#00ff88"
            strokeWidth="0.5"
          />
          <circle
            cx="200"
            cy="200"
            r="120"
            fill="none"
            stroke="#00ff88"
            strokeWidth="0.5"
          />
          <circle
            cx="200"
            cy="200"
            r="60"
            fill="none"
            stroke="#00ff88"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="relative z-10 text-center max-w-md">
        <p className="text-accent/60 text-xs tracking-[0.3em] mb-8">
          THE MACHINE
        </p>

        {/* Role selection */}
        {state === "role_selection" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xl text-white tracking-wider">
                Choose your role
              </p>
              <p className="text-sm text-gray-500">
                You&apos;ll be matched with a partner automatically.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleRoleSelected("scroller")}
                className="w-full border border-gray-700 hover:border-accent/60 p-5 text-left transition-colors group"
              >
                <p className="text-lg text-white tracking-wider group-hover:text-accent transition-colors">
                  I&apos;ll be the SCROLLER
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Watch a video feed and react naturally. Your face will be
                  read in real-time.
                </p>
              </button>

              <button
                onClick={() => handleRoleSelected("optimizer")}
                className="w-full border border-gray-700 hover:border-accent/60 p-5 text-left transition-colors group"
              >
                <p className="text-lg text-white tracking-wider group-hover:text-accent transition-colors">
                  I&apos;ll be the OPTIMIZER
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  See your partner&apos;s face and reactions. Pick videos to show
                  them. Figure out what makes them tick.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Searching for match */}
        {state === "searching" && (
          <div className="space-y-6">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 tracking-wider">
              Finding you a match...
            </p>
          </div>
        )}

        {/* Checking permissions (direct link join) */}
        {state === "checking_permissions" && (
          <div className="space-y-6">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 tracking-wider">
              Setting up session...
            </p>
          </div>
        )}

        {/* Waiting for partner */}
        {state === "waiting_for_partner" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-green-400/70">In queue</span>
            </div>

            <div className="border border-gray-800 p-6 space-y-3">
              <p className="text-lg text-white tracking-wider">
                Searching for a partner...
              </p>
              <p className="text-sm text-gray-500">
                You are the{" "}
                <span className="text-accent font-bold">{role.toUpperCase()}</span>
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Waiting for someone to join as{" "}
                {role === "scroller" ? "Optimizer" : "Scroller"}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-accent rounded-full animate-pulse"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="w-2 h-2 bg-accent rounded-full animate-pulse"
                style={{ animationDelay: "0.6s" }}
              />
            </div>
          </div>
        )}

        {/* Partner joined */}
        {state === "partner_joined" && (
          <div className="space-y-6">
            <div className="border border-accent/30 bg-accent/5 p-6">
              <p className="text-accent text-lg tracking-wider mb-2">
                Partner found!
              </p>
              <p className="text-gray-400 text-sm">
                Preparing your session...
              </p>
            </div>
          </div>
        )}

        {/* Countdown */}
        {state === "countdown" && (
          <div className="space-y-6">
            <p className="text-xs text-gray-500 tracking-widest">STARTING IN</p>
            <p className="text-8xl font-bold text-accent glow-text">
              {countdown}
            </p>
            <p className="text-sm text-gray-500 tracking-wider">
              {role === "scroller"
                ? "Get ready to scroll."
                : "Get ready to optimize."}
            </p>
          </div>
        )}

        {/* Role description */}
        {state !== "role_selection" && state !== "searching" && state !== "error" && (
          <div className="mt-12 border-t border-gray-900 pt-6">
            {role === "scroller" ? (
              <div className="text-left space-y-2">
                <p className="text-xs text-gray-600 tracking-widest">YOUR ROLE: SCROLLER</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  You&apos;ll see a video feed. Just scroll naturally. React honestly.
                  Someone is building your taste profile in real-time.
                </p>
              </div>
            ) : (
              <div className="text-left space-y-2">
                <p className="text-xs text-gray-600 tracking-widest">YOUR ROLE: OPTIMIZER</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  You&apos;ll see your Scroller&apos;s face and reactions. Pick videos
                  to show them. Send text cards. Figure out what makes them tick.
                </p>
              </div>
            )}
          </div>
        )}

        {state === "error" && (
          <div className="mt-8 border border-red-500/30 bg-red-500/5 p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
