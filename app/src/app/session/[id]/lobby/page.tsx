"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  assignSessionRole,
  createSessionSlot,
  fetchSessionSlot,
  upsertUserProfile,
} from "@/lib/supabase/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { ensureAnonSession } from "@/lib/supabase/auth";
import { isUuid } from "@/lib/supabase/utils";

type LobbyState =
  | "role_selection"
  | "checking_permissions"
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
  const isCreator = useSupabase && !isValidSessionId;
  const [state, setState] = useState<LobbyState>(
    isCreator ? "role_selection" : "checking_permissions"
  );
  const [countdown, setCountdown] = useState(3);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [role, setRole] = useState<"optimizer" | "scroller">("scroller");
  const [sessionId, setSessionId] = useState<string>("demo");
  const [shareLink, setShareLink] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Creator picks a role, then we create the session
  const handleRoleSelected = async (chosenRole: "optimizer" | "scroller") => {
    setState("checking_permissions");
    setRole(chosenRole);

    try {
      await ensureAnonSession();
      await upsertUserProfile();

      const id = crypto.randomUUID();
      setSessionId(id);
      setShareLink(`${window.location.origin}/session/${id}/lobby`);

      const created = await createSessionSlot(id, chosenRole, "lobby");
      if (!created) throw new Error("Failed to create session slot.");
      setCameraGranted(true);
      setState("waiting_for_partner");
    } catch (err) {
      console.error(err);
      setState("error");
      setError("Unable to create the session. Please refresh.");
    }
  };

  // Joiner flow: auto-assign opposite role when visiting a UUID link
  useEffect(() => {
    if (!useSupabase) {
      setSessionId("demo");
      return;
    }

    // Creators start in role_selection — don't auto-init
    if (isCreator) return;

    let active = true;

    const init = async () => {
      try {
        await ensureAnonSession();
        await upsertUserProfile();

        const id = rawSessionId;
        if (!active) return;
        setSessionId(id);
        setShareLink(`${window.location.origin}/session/${id}/lobby`);

        const existing = await fetchSessionSlot(id);
        if (!active) return;

        if (!existing) {
          setState("error");
          setError("Session not found. Ask for a new link.");
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
          setError("This session is full. Ask for a new link.");
          return;
        }

        setCameraGranted(true);
        setState("waiting_for_partner");
      } catch (err) {
        console.error(err);
        setState("error");
        setError("Unable to initialize the session. Please refresh.");
      }
    };

    init();

    return () => {
      active = false;
    };
  }, [isValidSessionId, rawSessionId, useSupabase, isCreator]);

  // Simulate lobby flow
  useEffect(() => {
    if (useSupabase) return;
    // Step 1: Check camera permissions
    const camTimer = setTimeout(() => {
      setCameraGranted(true);
      setState("waiting_for_partner");
    }, 2000);

    // Step 2: Partner "joins"
    const partnerTimer = setTimeout(() => {
      setState("partner_joined");
    }, 5000);

    // Step 3: Countdown
    const countdownTimer = setTimeout(() => {
      setState("countdown");
    }, 7000);

    return () => {
      clearTimeout(camTimer);
      clearTimeout(partnerTimer);
      clearTimeout(countdownTimer);
    };
  }, [useSupabase]);

  useEffect(() => {
    if (!useSupabase || !sessionId || !isUuid(sessionId)) return;

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
  }, [sessionId, useSupabase]);

  // Countdown timer
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      // Navigate to the appropriate view
      router.push(`/session/${sessionId}/${role}`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, router, role, sessionId]);

  return (
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

        {/* Role selection (creator only) */}
        {state === "role_selection" && (
          <div className="space-y-8">
            <div className="space-y-2">
              <p className="text-xl text-white tracking-wider">
                Choose your role
              </p>
              <p className="text-sm text-gray-500">
                Your partner will get the opposite role.
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

        {/* Checking permissions */}
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
              <span className="text-sm text-green-400/70">Session ready</span>
            </div>

            <div className="border border-gray-800 p-6 space-y-3">
              <p className="text-lg text-white tracking-wider">
                Waiting for your partner...
              </p>
              <p className="text-sm text-gray-500">
                You are the{" "}
                <span className="text-accent font-bold">{role.toUpperCase()}</span>
              </p>
            </div>

            {useSupabase && shareLink && (
              <div className="border border-accent/30 bg-accent/5 p-5 space-y-3">
                <p className="text-sm text-accent tracking-wider font-medium">
                  Send this link to your partner
                </p>
                <div className="bg-black/50 border border-gray-700 p-3 rounded text-sm text-gray-300 break-all select-all">
                  {shareLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="w-full py-2 border border-accent/50 text-accent text-sm tracking-wider hover:bg-accent/10 transition-colors"
                >
                  {linkCopied ? "COPIED!" : "COPY LINK"}
                </button>
              </div>
            )}

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
                Partner connected
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
        {state !== "role_selection" && state !== "checking_permissions" && (
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
          </div>
        )}
      </div>
    </div>
  );
}
