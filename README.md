# the-machine

## Current state

- Next.js 16 app with demo flow plus Supabase-backed realtime sessions.
- **Authentication**: Email/password and OAuth (Google, GitHub) sign-in required for production sessions.
- **Automatic matchmaking**: players queue up and get paired in real-time via Supabase RPC with row-level locking. Direct UUID link joining also works.
- **Lobby with role selection**: creator picks Scroller or Optimizer, gets matched automatically or shares a direct link.
- **Camera consent**: Explicit consent modal before enabling camera capture with data retention disclosure.
- Scroller broadcasts scroll events and camera snapshots with rate limiting (client + server).
- Optimizer receives realtime updates, queues videos, and sends text cards.
- **Reconnection handling**: Automatic exponential backoff reconnection for realtime channels with status UI.
- **Rate limiting**: Client-side and server-side (RLS) rate limits on text cards, scroll events, and camera frames.
- **Abuse prevention**: Session limits (10/day), cooldown (30s between sessions), and abuse reporting system.
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
2. Run the SQL migrations in order from `supabase/migrations/`:
   - `001_initial_schema.sql` - Core tables and RLS
   - `002_public_access.sql` - Demo access (optional for production)
   - `003_auth_rls.sql` - Authenticated RLS policies
   - `004_users_profile.sql` - User profile updates
   - `005_matchmaking.sql` - Matchmaking RPC function
   - `006_rate_limits.sql` - Rate limiting policies
   - `007_abuse_prevention.sql` - Abuse prevention triggers
3. Enable **Email Auth** and configure OAuth providers (Google, GitHub) in Supabase Auth settings.
   - Disable anonymous sign-ins for production.
   - Configure redirect URLs: `https://your-domain.com/auth/callback`
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

- ✅ Replace anonymous auth with real sign-in (email/OAuth) and user profiles.
- ✅ Tighten RLS further for production (rate limits, write validation).
- ✅ Add robust error handling + reconnect states for realtime.
- ✅ Add explicit consent UX and data retention policy for camera data.
- ✅ Add abuse prevention (rate limits, moderation, quotas).
- Expand/curate the video corpus and metadata pipeline.
- Add admin moderation UI for abuse reports.
- Improve error messages and user feedback throughout the app.
- Add analytics and monitoring for session quality.
