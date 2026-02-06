"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type LobbyState =
  | "checking_permissions"
  | "waiting_for_partner"
  | "partner_joined"
  | "countdown"
  | "error";

export default function LobbyPage() {
  const router = useRouter();
  const [state, setState] = useState<LobbyState>("checking_permissions");
  const [countdown, setCountdown] = useState(3);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [role] = useState<"optimizer" | "scroller">(
    Math.random() > 0.5 ? "optimizer" : "scroller"
  );

  // Simulate lobby flow
  useEffect(() => {
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
  }, []);

  // Countdown timer
  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown <= 0) {
      // Navigate to the appropriate view
      router.push(`/session/demo/${role}`);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state, countdown, router, role]);

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

        {/* Checking permissions */}
        {state === "checking_permissions" && (
          <div className="space-y-6">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 tracking-wider">
              Checking camera access...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  cameraGranted ? "bg-green-500" : "bg-gray-600 animate-pulse"
                }`}
              />
              <span className="text-xs text-gray-500">Camera</span>
            </div>
          </div>
        )}

        {/* Waiting for partner */}
        {state === "waiting_for_partner" && (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-green-400/70">Camera ready</span>
            </div>

            <div className="border border-gray-800 p-6 space-y-3">
              <p className="text-lg text-white tracking-wider">
                Waiting for your partner...
              </p>
              <p className="text-sm text-gray-500">
                You&apos;ve been assigned as the{" "}
                <span className="text-accent font-bold">{role.toUpperCase()}</span>
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
      </div>
    </div>
  );
}
