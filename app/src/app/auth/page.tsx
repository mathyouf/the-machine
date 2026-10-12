"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

type AuthMode = "sign_in" | "sign_up" | "magic_link";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      router.push("/session/new/lobby");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "magic_link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Check your email for a magic link!");
        return;
      }

      if (mode === "sign_up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setSuccess("Check your email to confirm your account!");
        return;
      }

      // sign_in
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/session/new/lobby");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured) {
      router.push("/session/new/lobby");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    if (!isSupabaseConfigured) {
      router.push("/session/new/lobby");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      router.push("/session/new/lobby");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Anonymous sign-in failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 sacred-geometry-bg">
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <svg viewBox="0 0 400 400" className="w-[500px] h-[500px]">
          <circle cx="200" cy="200" r="180" fill="none" stroke="#00ff88" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="120" fill="none" stroke="#00ff88" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="60" fill="none" stroke="#00ff88" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-accent/60 text-xs tracking-[0.3em] mb-2">THE MACHINE</p>
          <h1 className="text-2xl font-bold tracking-wider text-white">
            {mode === "sign_up" ? "CREATE ACCOUNT" : "SIGN IN"}
          </h1>
        </div>

        {error && (
          <div className="border border-red-500/30 bg-red-500/5 p-3 mb-4 text-center">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {success && (
          <div className="border border-green-500/30 bg-green-500/5 p-3 mb-4 text-center">
            <p className="text-green-400 text-xs">{success}</p>
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-3 mb-4 border border-gray-700 text-gray-300 text-xs tracking-widest hover:border-accent hover:text-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600 tracking-widest">OR</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-3 focus:border-accent focus:outline-none placeholder:text-gray-600"
          />

          {mode !== "magic_link" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm p-3 focus:border-accent focus:outline-none placeholder:text-gray-600"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-black font-bold tracking-widest text-xs hover:bg-accent/80 transition-all disabled:opacity-50"
          >
            {loading
              ? "LOADING..."
              : mode === "magic_link"
                ? "SEND MAGIC LINK"
                : mode === "sign_up"
                  ? "CREATE ACCOUNT"
                  : "SIGN IN"}
          </button>
        </form>

        {/* Mode toggles */}
        <div className="mt-6 text-center space-y-2">
          {mode === "sign_in" && (
            <>
              <button
                onClick={() => setMode("magic_link")}
                className="text-xs text-gray-500 hover:text-accent transition-colors tracking-wider block w-full"
              >
                USE MAGIC LINK INSTEAD
              </button>
              <button
                onClick={() => setMode("sign_up")}
                className="text-xs text-gray-500 hover:text-accent transition-colors tracking-wider block w-full"
              >
                DON&apos;T HAVE AN ACCOUNT? SIGN UP
              </button>
            </>
          )}
          {mode === "sign_up" && (
            <button
              onClick={() => setMode("sign_in")}
              className="text-xs text-gray-500 hover:text-accent transition-colors tracking-wider"
            >
              ALREADY HAVE AN ACCOUNT? SIGN IN
            </button>
          )}
          {mode === "magic_link" && (
            <button
              onClick={() => setMode("sign_in")}
              className="text-xs text-gray-500 hover:text-accent transition-colors tracking-wider"
            >
              USE PASSWORD INSTEAD
            </button>
          )}
        </div>

        {/* Anonymous option */}
        <div className="mt-8 pt-6 border-t border-gray-900 text-center">
          <button
            onClick={handleAnonymous}
            disabled={loading}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors tracking-wider disabled:opacity-50"
          >
            CONTINUE AS GUEST (anonymous)
          </button>
          <p className="text-[10px] text-gray-700 mt-1">
            Guest sessions can&apos;t be recovered. Sign in to track your score.
          </p>
        </div>
      </div>
    </div>
  );
}
