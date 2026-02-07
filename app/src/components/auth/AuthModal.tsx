"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split("@")[0],
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user && !data.session) {
          setMessage("Check your email to confirm your account!");
          setTimeout(() => {
            onClose();
          }, 3000);
        } else if (data.session) {
          await createUserProfile(data.user!.id, displayName || email.split("@")[0]);
          onSuccess();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.session) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "OAuth sign-in failed");
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string, displayName: string) => {
    try {
      await supabase.from("users").upsert({
        id: userId,
        display_name: displayName,
        email,
      });
    } catch (err) {
      console.error("Failed to create user profile:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md border border-gray-800 bg-black p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold tracking-wider mb-2">
          {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "signin"
            ? "Welcome back to The Machine"
            : "Join The Machine experiment"}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          {mode === "signup" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1 tracking-wider">
                DISPLAY NAME
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 px-3 py-2 text-sm focus:border-accent focus:outline-none"
                placeholder="How should others see you?"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1 tracking-wider">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-800 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1 tracking-wider">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-gray-900 border border-gray-800 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-black font-bold py-2 tracking-wider hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "LOADING..." : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black px-2 text-gray-600 tracking-wider">OR</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthSignIn("google")}
            disabled={loading}
            className="w-full border border-gray-800 py-2 text-sm tracking-wider hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuthSignIn("github")}
            disabled={loading}
            className="w-full border border-gray-800 py-2 text-sm tracking-wider hover:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with GitHub
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-accent hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-accent hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-600 text-center leading-relaxed">
          By continuing, you agree to participate in this research experiment
          and understand that your interactions may be recorded and analyzed.
        </p>
      </div>
    </div>
  );
}
