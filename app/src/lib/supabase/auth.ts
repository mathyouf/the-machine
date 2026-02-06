import { supabase } from "./client";

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
