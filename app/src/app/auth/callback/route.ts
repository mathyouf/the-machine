import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors in middleware
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Create or update user profile
      await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email,
        display_name: data.user.user_metadata.display_name ||
                      data.user.user_metadata.full_name ||
                      data.user.email?.split("@")[0],
        avatar_url: data.user.user_metadata.avatar_url,
      });
    }
  }

  // Redirect to lobby or home
  return NextResponse.redirect(`${origin}/session/new/lobby`);
}
