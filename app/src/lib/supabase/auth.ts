import { supabase } from "./client";

/**
 * Ensures the user has an authenticated session.
 * For production, users must sign in with email/OAuth.
 * Returns null if no session exists (caller should prompt for auth).
 */
export async function ensureAuthSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session && !sessionData.session.user.is_anonymous) {
    return sessionData.session;
  }
  return null;
}

/**
 * Legacy: Anonymous session support (kept for backward compatibility with demo mode).
 * Should not be used for production sessions.
 */
export async function ensureAnonSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) return sessionData.session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getUserProfile() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.session.user.id)
    .single();

  return profile;
}

export async function signOut() {
  await supabase.auth.signOut();
}
