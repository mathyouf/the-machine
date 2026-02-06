"use client";

import { useState, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { UmapReveal } from "@/components/reveal/UmapReveal";
import { TextCardReplay } from "@/components/reveal/TextCardReplay";
import { ScoreReveal } from "@/components/reveal/ScoreReveal";
import { MutualOptIn } from "@/components/reveal/MutualOptIn";
import { DEMO_SESSION_SUMMARY, DEMO_TEXT_CARDS } from "@/lib/demo-data";
import {
  fetchScrollEvents,
  fetchSessionSummary,
  fetchTextCards,
  fetchVideos,
  insertSessionSummary,
  upsertUserProfile,
} from "@/lib/supabase/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { isUuid } from "@/lib/supabase/utils";
import { buildSessionSummary } from "@/lib/supabase/summary";
import { Video } from "@/lib/supabase/types";
import { ensureAnonSession } from "@/lib/supabase/auth";

type RevealStep = "umap" | "text_cards" | "score" | "opt_in" | "call" | "debrief";

export default function RevealPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "demo";
  const [authReady, setAuthReady] = useState(false);
  const useSupabase = isSupabaseConfigured && authReady && isUuid(sessionId);
  const [step, setStep] = useState<RevealStep>("umap");
  const [summary, setSummary] = useState(DEMO_SESSION_SUMMARY);
  const [cards, setCards] = useState(DEMO_TEXT_CARDS);

  const advanceStep = useCallback(() => {
    setStep((prev) => {
      switch (prev) {
        case "umap":
          return "text_cards";
        case "text_cards":
          return "score";
        case "score":
          return "opt_in";
        case "opt_in":
          return "call";
        default:
          return "debrief";
      }
    });
  }, []);

  // Skip button for demo
  const handleSkip = () => advanceStep();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }
    ensureAnonSession()
      .then(() => upsertUserProfile())
      .then(() => setAuthReady(true))
      .catch(() => setAuthReady(false));
  }, []);

  useEffect(() => {
    if (!useSupabase) return;

    let active = true;

    const load = async () => {
      const existing = await fetchSessionSummary(sessionId);
      if (!active) return;
      if (existing) {
        setSummary(existing);
      } else {
        const [events, videos] = await Promise.all([
          fetchScrollEvents(sessionId),
          fetchVideos({ fallbackToDemo: false }),
        ]);
        if (!active) return;
        const videoMap = new Map<string, Video>(videos.map((v) => [v.id, v]));
        const computed = buildSessionSummary(sessionId, events, videoMap);
        setSummary(computed);
        insertSessionSummary(computed);
      }

      const textCards = await fetchTextCards(sessionId);
      if (!active) return;
      if (textCards.length > 0) setCards(textCards);
    };

    load();

    return () => {
      active = false;
    };
  }, [sessionId, useSupabase]);

  return (
    <div className="relative">
      {/* Skip button for demo navigation */}
      <button
        onClick={handleSkip}
        className="fixed top-4 right-4 z-50 text-xs text-gray-600 hover:text-gray-400 tracking-widest border border-gray-800 hover:border-gray-600 px-3 py-1.5 transition-colors"
      >
        SKIP
      </button>

      {/* Step indicator */}
      <div className="fixed top-4 left-4 z-50 flex gap-1">
        {(["umap", "text_cards", "score", "opt_in"] as RevealStep[]).map(
          (s) => (
            <div
              key={s}
              className={`w-8 h-0.5 transition-colors ${
                step === s
                  ? "bg-accent"
                  : (["umap", "text_cards", "score", "opt_in"] as RevealStep[]).indexOf(s) <
                      (["umap", "text_cards", "score", "opt_in"] as RevealStep[]).indexOf(step)
                    ? "bg-accent/30"
                    : "bg-gray-800"
              }`}
            />
          )
        )}
      </div>

      {step === "umap" && (
        <UmapReveal
          featureVector={summary.final_feature_vector}
          onComplete={advanceStep}
        />
      )}

      {step === "text_cards" && (
        <TextCardReplay cards={cards} onComplete={advanceStep} />
      )}

      {step === "score" && (
        <ScoreReveal summary={summary} onComplete={advanceStep} />
      )}

      {step === "opt_in" && (
        <MutualOptIn
          onAccept={() => setStep("call")}
          onDecline={() => setStep("debrief")}
        />
      )}

      {step === "call" && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-xs text-gray-600 tracking-[0.3em] mb-6">
              VIDEO CALL
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="aspect-video bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span className="text-gray-600 text-xs tracking-wider">YOU</span>
              </div>
              <div className="aspect-video bg-gray-900 border border-gray-800 flex items-center justify-center">
                <span className="text-gray-600 text-xs tracking-wider">
                  YOUR MATCH
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              In a live session, you&apos;d now be on a video call with your
              Optimizer/Scroller.
            </p>
            <button
              onClick={() => setStep("debrief")}
              className="px-8 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
            >
              END CALL
            </button>
          </div>
        </div>
      )}

      {step === "debrief" && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
          <div className="max-w-md w-full">
            <p className="text-xs text-gray-600 tracking-[0.3em] mb-6 text-center">
              FIELD REPORT
            </p>
            <p className="text-gray-400 text-sm text-center mb-6">
              Write a short paragraph about your Machine experience.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-gray-600">What surprised you?</p>
                <p className="text-xs text-gray-600">
                  What did the Optimizer get right or wrong?
                </p>
                <p className="text-xs text-gray-600">
                  What did the reveal feel like?
                </p>
              </div>

              <textarea
                className="w-full bg-gray-900 border border-gray-700 text-white font-mono text-sm p-4 h-32 focus:border-accent focus:outline-none resize-none placeholder:text-gray-600"
                placeholder="Write your field report..."
              />

              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  className="accent-accent"
                />
                May we share this? (anonymized)
              </label>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full py-3 bg-accent text-black font-bold tracking-widest hover:bg-accent/80 transition-all"
              >
                SUBMIT & FINISH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
