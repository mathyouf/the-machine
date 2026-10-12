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
  fetchUserRole,
  fetchVideos,
  insertFieldReport,
  insertSessionSummary,
  updateOptInDecision,
  updateSessionStatus,
  upsertUserProfile,
} from "@/lib/supabase/data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { isUuid } from "@/lib/supabase/utils";
import { buildSessionSummary } from "@/lib/supabase/summary";
import { Video } from "@/lib/supabase/types";
import { ensureAnonSession } from "@/lib/supabase/auth";

type RevealStep = "umap" | "text_cards" | "score" | "opt_in" | "both_accepted" | "debrief";

export default function RevealPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params?.id ?? "demo";
  const [authReady, setAuthReady] = useState(false);
  const useSupabase = isSupabaseConfigured && authReady && isUuid(sessionId);
  const [step, setStep] = useState<RevealStep>("umap");
  const [summary, setSummary] = useState(DEMO_SESSION_SUMMARY);
  const [cards, setCards] = useState(DEMO_TEXT_CARDS);
  const [userRole, setUserRole] = useState<"optimizer" | "scroller" | null>(null);
  const [partnerDecision, setPartnerDecision] = useState<boolean | null>(null);
  const [fieldReportText, setFieldReportText] = useState("");
  const [shareConsent, setShareConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
          return "debrief";
        default:
          return "debrief";
      }
    });
  }, []);

  const handleSkip = () => advanceStep();

  // Auth + role detection
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

  // Detect user role
  useEffect(() => {
    if (!useSupabase) return;
    fetchUserRole(sessionId).then((role) => {
      if (role) setUserRole(role);
    });
  }, [sessionId, useSupabase]);

  // Set session status to 'reveal'
  useEffect(() => {
    if (!useSupabase) return;
    updateSessionStatus(sessionId, "reveal");
  }, [sessionId, useSupabase]);

  // Load summary + text cards
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

  // Subscribe to session_summaries for partner's opt-in decision
  useEffect(() => {
    if (!useSupabase || !userRole) return;

    const partnerCol =
      userRole === "scroller" ? "optimizer_accepted_call" : "scroller_accepted_call";

    const channel = supabase
      .channel(`summary_optin:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "session_summaries",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const next = payload.new as Record<string, unknown>;
          if (next[partnerCol] !== null && next[partnerCol] !== undefined) {
            setPartnerDecision(next[partnerCol] as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, useSupabase, userRole]);

  // Opt-in handlers
  const handleOptInAccept = useCallback(() => {
    if (useSupabase && userRole) {
      updateOptInDecision(sessionId, userRole, true);
    }
  }, [sessionId, useSupabase, userRole]);

  const handleOptInDecline = useCallback(() => {
    if (useSupabase && userRole) {
      updateOptInDecision(sessionId, userRole, false);
    }
    setStep("debrief");
  }, [sessionId, useSupabase, userRole]);

  const handleBothAccepted = useCallback(() => {
    setStep("both_accepted");
  }, []);

  // Field report submission
  const handleSubmitFieldReport = async () => {
    if (submitting) return;
    setSubmitting(true);

    if (useSupabase && userRole && fieldReportText.trim()) {
      await insertFieldReport(sessionId, userRole, fieldReportText.trim(), shareConsent);
      await updateSessionStatus(sessionId, "completed");
    }

    window.location.href = "/";
  };

  return (
    <div className="relative">
      {/* Skip button */}
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
          onAccept={handleOptInAccept}
          onDecline={handleOptInDecline}
          onBothAccepted={handleBothAccepted}
          partnerDecision={partnerDecision}
          isRealSession={useSupabase}
        />
      )}

      {step === "both_accepted" && (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-md">
            <p className="text-xs text-gray-600 tracking-[0.3em] mb-6">
              MUTUAL MATCH
            </p>
            <p className="text-2xl text-accent mb-4 tracking-wider">
              You both said yes.
            </p>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              The Machine brought you together. What happens next is up to you.
            </p>
            <button
              onClick={() => setStep("debrief")}
              className="px-8 py-2 border border-gray-700 text-gray-400 text-xs tracking-widest hover:border-accent hover:text-accent transition-all"
            >
              CONTINUE TO DEBRIEF
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
                value={fieldReportText}
                onChange={(e) => setFieldReportText(e.target.value)}
              />

              <label className="flex items-center gap-2 text-xs text-gray-500">
                <input
                  type="checkbox"
                  className="accent-accent"
                  checked={shareConsent}
                  onChange={(e) => setShareConsent(e.target.checked)}
                />
                May we share this? (anonymized)
              </label>

              <button
                onClick={handleSubmitFieldReport}
                disabled={submitting}
                className="w-full py-3 bg-accent text-black font-bold tracking-widest hover:bg-accent/80 transition-all disabled:opacity-50"
              >
                {submitting ? "SUBMITTING..." : "SUBMIT & FINISH"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
