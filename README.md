# the-machine

## Current state

- Next.js 16 app with demo flow plus Supabase-backed realtime sessions.
- Anonymous auth is used to secure session writes without full login.
- **Lobby with role selection**: creator picks Scroller or Optimizer, gets a share link with copy button, partner auto-assigns the opposite role.
- Scroller broadcasts scroll events and (optional) camera snapshots.
- Optimizer receives realtime updates, queues videos, and sends text cards.
- Reveal computes a session summary from recorded events.
- Leaderboard reads from Supabase when available.

## Vercel deployment status

**Deployed to**: https://the-machine-phi.vercel.app (under Love Labs team)

**BLOCKER**: Vercel returns 404 on all routes despite successful builds. The build log shows all routes generated correctly. Troubleshooting done so far:

1. Set Root Directory to `app` in Vercel project settings (the Next.js project lives in `app/`, not repo root).
2. Disabled Deployment Protection (was returning 401 before).
3. Redeployed multiple times — build succeeds, routes listed, but 404 persists on all URLs including static pages.

**Next steps to unblock**:
- Try redeploying with "Use existing Build Cache" unchecked.
- If that fails, delete the Vercel project and re-import the repo fresh, setting Root Directory to `app` and Framework to Next.js during setup.
- Verify no duplicate Vercel projects are linked to the same repo.

## Lobby flow

```
Creator:  /session/new/lobby → role picker → pick role → create session → share link + wait
Partner:  /session/{uuid}/lobby → auto-assign opposite role → both present → countdown → start
```

The home page "JOIN THE NEXT SESSION" button links to `/session/new/lobby`.

## Supabase setup

1. Create a new Supabase project.
2. Run the SQL in `supabase/migrations/001_initial_schema.sql`.
3. Run the SQL in `supabase/migrations/003_auth_rls.sql` and
   `supabase/migrations/004_users_profile.sql`.
4. Optional: run `supabase/migrations/002_public_access.sql` only for demo-mode
   public access (not recommended for live users).
5. Enable **Anonymous Sign-Ins** in Supabase Auth settings.
6. Add the following env vars in Vercel or your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (needed for seeding scripts)
7. Seed videos:
   - `cd app && npm run seed:videos`

Once configured, the app will use Supabase for sessions, realtime events,
text cards, and reveal summaries. If Supabase is not configured, the app
falls back to local demo data.

## How to run locally

- `cd app && npm run dev`
- Visit `http://localhost:3000/session/new/lobby` to create a session and share the link.

## What is left to do (for public live tests)

- **Fix Vercel deployment** (see blocker above).
- Replace anonymous auth with real sign-in (email/OAuth) and user profiles.
- Tighten RLS further for production (rate limits, write validation).
- Build real matchmaking instead of sharing a link.
- Add robust error handling + reconnect states for realtime.
- Add explicit consent UX and data retention policy for camera data.
- Add abuse prevention (rate limits, moderation, quotas).
- Expand/curate the video corpus and metadata pipeline.