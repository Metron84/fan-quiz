# CLAUDE.md: Are You Really a Fan?

Standing rulebook for every Claude Code session in this repo. Work one phase at a time and stop at each gate for Melo.

## What this is
- A wheel-spin football quiz anyone can play as a guest.
- After the game it hands the player to thereflectivefootball.com to sign up and save the score.
- The weekly top score wins a prize, still to be determined.
- Part of The Reflective Football (TRF). Tagline: "Football is nothing without the fans".

## Locked decisions
- Stack: Next.js App Router, TypeScript, Tailwind, deployed on Vercel.
- Data: the existing TRF Supabase project, server-side only, new tables prefixed `fan_quiz_`.
- Hosting: play.thereflectivefootball.com, added in Vercel (Vercel is the DNS provider).
- Answers never reach the browser. All answer checking and scoring happen on the server.
- No PWA, no service worker.
- Typography is Archivo only. Never Bodoni Moda.
- Colours: cream #F2EDE4, navy #0A111F, signal red #D8232A. Cream-first.
- NO DEAD ENDS: every screen offers a next step.
- Copy is short. No em-dashes.
- Mobile first, then desktop.
- Conventional commits, small diffs, no force pushes.
- No demo or sample routes. Build the real thing.
- Never print or ask for secrets in chat. Env vars only.
- Never mention "We Are Football" anywhere.

## Game rules
- Score starts at 0. Negative scores are allowed.
- Wheel shows active categories only (all five values populated), 8 segments max.
- Spin lands on a category. The server picks a random unused value and reveals it.
- A used category/value cell is removed for the session. A category leaves the wheel when all five values are used.
- Question appears in a modal. Player types, or taps to speak.
- Correct adds the value. Incorrect subtracts it. A timeout counts as incorrect.
- Timer: `ANSWER_SECONDS` (default 45).
- After question 5 ask "Do you want to continue?". Hard cap at 10 questions.
- End screen: total points, answered, correct, incorrect, average points per question. Buttons: Save score, Play again, Watch films on TRF.

## Data rules
- Source of truth: `data/questions.json`. Server-only path. Never import from a client component, never place in /public.
- Fields: id, category, value, clue, answer, matchMode, tags, check, source, plus acceptedAnswers or answerGroups with requiredCount.
- A session never serves two questions sharing a tag, or two with the same `answer`.
- The client never receives acceptedAnswers, answerGroups, tags, check or source.
- `npm run validate:questions` fails the build on duplicate ids, empty cells, an accepted answer equal to its category or found in its own clue, missing fields, unknown matchMode, or an em-dash in a clue.

## Server rules
- Table `fan_quiz_sessions`. RLS on, no anon policies, service role only.
- Session id in an httpOnly, secure, sameSite=lax cookie.
- Every state change is atomic (single update with a version check).
- Rate limit per IP on every route. Reject answers after deadline plus 2 seconds.
- Migrations are written to `supabase/migrations/` and handed to Melo. Never run them.

## Hand-off
- HS256 token signed with `PLAY_HANDOFF_SECRET`. Claims: sid, score, answered, correct, incorrect, completedAt, nonce, exp (15 min).
- Redirect to `https://thereflectivefootball.com/play/claim?t=<token>`.
- The game never stores a player name.

## Prize
- Every prize word sits behind `PRIZE_ENABLED` (default false).
- No prize copy ships until Melo confirms the Dubai promotion permit position and terms text.

## Phases
1. Scaffold and rules. 2. Data and matcher. 3. Server. 4. UI. 5. Hand-off (plus Part B in Metron84/reflective, separate commit). 6. Deploy (Vercel preview only).
- Production and the subdomain need Melo's explicit approval.
- Part B (main site) lives in `Metron84/reflective`.
