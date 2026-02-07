# the-machine

## Current state

- Next.js 16 app with demo flow plus Supabase-backed realtime sessions.
- Anonymous auth is used to secure session writes without full login.
- **Automatic matchmaking**: players queue up and get paired in real-time via Supabase RPC with row-level locking. Direct UUID link joining also works.
- **Lobby with role selection**: creator picks Scroller or Optimizer, gets matched automatically or shares a direct link.
- Scroller broadcasts scroll events and (optional) camera snapshots.
- Optimizer receives realtime updates, queues videos, and sends text cards.
- Reveal computes a session summary with mutual opt-in for post-session connection.
- Field reports are persisted per-session.
- Leaderboard reads from Supabase when available.

## Deployment

- **Vercel**: https://the-machine-phi.vercel.app (Love Labs team, Next.js framework, root directory `app/`)
- **Supabase**: `bakuhfaxkrghpogrujoi` (us-east-2, active)
- **GitHub**: https://github.com/mathyouf/the-machine

## Lobby flow

```
Auto-match: /session/new/lobby → role picker → pick role → queue for matchmaking → paired → countdown → start
Direct link: /session/{uuid}/lobby → auto-assign opposite role → both present → countdown → start
```

The home page "JOIN THE NEXT SESSION" button links to `/session/new/lobby`.

## Supabase setup

1. Create a new Supabase project.
2. Run the SQL migrations in order from `supabase/migrations/`.
3. Enable **Anonymous Sign-Ins** in Supabase Auth settings.
4. Add the following env vars in Vercel or your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (needed for seeding scripts)
5. Seed videos:
   - `cd app && npm run seed:videos`

Once configured, the app will use Supabase for sessions, realtime events,
text cards, and reveal summaries. If Supabase is not configured, the app
falls back to local demo data.

## How to run locally

- `cd app && npm run dev`
- Visit `http://localhost:3000/session/new/lobby` to create a session.

## What is left to do (for public live tests)

- Replace anonymous auth with real sign-in (email/OAuth) and user profiles.
- Tighten RLS further for production (rate limits, write validation).
- Add robust error handling + reconnect states for realtime.
- Add explicit consent UX and data retention policy for camera data.
- Add abuse prevention (rate limits, moderation, quotas).
- Expand/curate the video corpus and metadata pipeline.
