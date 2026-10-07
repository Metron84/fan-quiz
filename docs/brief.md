# Brief for Claude Code: "Are You Really a Fan?"

Standalone repo. Work one phase at a time and stop at each gate for Melo.

## What we are building
- A wheel-spin football quiz that anyone can play as a guest.
- After the game it hands the player to thereflectivefootball.com to sign up and save the score.
- The weekly top score wins a prize, still to be determined.
- Part of The Reflective Football (TRF), tagline "Football is nothing without the fans".

## Locked decisions
- Stack: Next.js App Router, TypeScript, Tailwind, deployed on Vercel.
- Data: the existing TRF Supabase project, server-side only, new tables prefixed `fan_quiz_`.
- Hosting: subdomain play.thereflectivefootball.com, added in Vercel (Vercel is the DNS provider, no external DNS step).
- Answers never reach the browser. All answer checking and scoring happen on the server.
- No PWA, no service worker.
- Typography is Archivo only. Never Bodoni Moda.
- Colours: cream #F2EDE4, navy #0A111F, signal red #D8232A. Cream-first.
- "NO DEAD ENDS": every screen offers a next step.
- Copy is short, no em-dashes.
- Build mobile first, then desktop.
- Conventional commits, small diffs.
- Do not build demo or sample routes. Build the real thing and fix errors afterwards.
- Never print or ask for secrets in chat. Env vars only.

## Game rules
- Score starts at 0 and negative scores are allowed.
- The wheel shows the active categories only (categories with all five values populated).
- Spin lands on a category. The server then picks a random unused value from that category and reveals it.
- A used category and value cell is removed for the rest of the session.
- A category leaves the wheel once all five of its values are used.
- The question appears in a modal. The player types, or taps to speak.
- Correct adds the value. Incorrect subtracts the value.
- Score is always visible and updates live.
- After question 5, ask "Do you want to continue?" (Yes or No).
- Hard cap at 10 questions.
- Answer timer: 45 seconds, configurable as `ANSWER_SECONDS`. A timeout counts as incorrect.
- End screen: total points, questions answered, correct, incorrect, average points per question.
- End screen buttons: Save score (hand-off), Play again, Watch films on TRF.

## Data
- Source of truth: `data/questions.json` (supplied, 60 questions, 4 categories so far, 3 variants per cell).
- Put it in a server-only module path. It must never be imported by a client component or placed in /public.
- Fields: id, category, value, clue, answer, matchMode, tags, check, source, plus either acceptedAnswers or answerGroups with requiredCount.
- `answer` is the display string shown after the player answers.
- `tags` mark questions about the same event. A session never serves two questions that share a tag.
- A session also never serves two questions with the same `answer`.
- A category is active only if each of the five values has at least one question.
- Draw one variant at random per cell.
- More categories (Managers, Potpourri, Premier League, World Cup) will be added later as the same JSON shape.
- Write `npm run validate:questions` and fail the build on any of these:
  - duplicate ids
  - a cell with fewer than 3 variants (warn) or 0 variants (error)
  - an accepted answer equal to its own category name
  - an accepted answer that appears inside its own clue
  - a missing field or an unknown matchMode
  - an em-dash in a clue

## Answer matching (server, pure function, unit tested)
- Normalise both sides: lowercase, strip accents, turn hyphens and slashes into spaces, drop other punctuation, collapse spaces.
- Drop a leading "the" on both sides.
- `fuzzy` mode:
  - exact match on any accepted answer passes
  - a full-phrase match inside a longer input passes (for example "it was Didier Drogba")
  - edit-distance tolerance by length of the accepted answer: 0 for 4 characters or fewer, 1 for 5 to 8, 2 for 9 or more
- `strict` mode (years, seasons, decades): the normalised input must equal an accepted answer, or equal "in " plus an accepted answer.
- `answerGroups` with `requiredCount`: split input on commas, "and", "&" and spaces into candidate names, count distinct groups matched, pass if the count reaches `requiredCount`.
- Tests must cover: "drogba", "Didier Drogba!", "kane" vs "kain" (rejected), "2013/14" and "2014" for a season, "80s" for the 1980s, "Moore and Hurst" for the multi answer, and an accented "Atletico".

## Server state and API
- Table `fan_quiz_sessions`: id (uuid), state (jsonb), started_at, completed_at, claimed_by (uuid, null), claimed_at.
- State holds used cells, served question ids, pending question, answers log, score, answered count.
- RLS on with no anon policies. Only the server (service role) reads and writes.
- Session id lives in an httpOnly, secure, sameSite=lax cookie.
- Every state change is atomic (single update with a version check) so a replayed request cannot re-answer a question.
- `POST /api/session`: create session, returns active categories only.
- `POST /api/spin`: rejects if a question is pending or the cap is reached. Returns category, value, questionId, clue, deadline.
- `POST /api/answer`: body is the answer text. Returns correct, pointsChange, score, answered, the display `answer`, and next step (spin, continuePrompt, finished).
- `POST /api/continue`: body is yes or no after question 5.
- `POST /api/finish`: freezes the session, returns the summary and the hand-off URL.
- Rate limit per IP on every route. Reject answers after the deadline plus a 2 second grace.
- The client never receives acceptedAnswers, answerGroups, tags, check or source.

## Wheel UI
- 8 segments maximum, one per category, readable on a 380px phone.
- Spin animation lands on the server-chosen category, then the value chip flips in.
- Wheel segments for exhausted categories are greyed out.
- Respect prefers-reduced-motion with a short fade instead of a spin.
- Typing is the default answer input. A "Tap to speak" button uses the Web Speech API where available and is hidden where it is not (Firefox, some iOS).
- Show the correct answer after every question, then a Spin button.

## Hand-off to thereflectivefootball.com
- On Save score the game server signs a token with HS256 using `PLAY_HANDOFF_SECRET`.
- Claims: sid (session id), score, answered, correct, incorrect, completedAt, nonce, exp (15 minutes).
- Redirect to `https://thereflectivefootball.com/play/claim?t=<token>`.
- The main site verifies the token, requires sign-in (Google or magic link, the existing pattern), then saves the score.
- One claim per session id (unique constraint). Replay returns the existing result.
- The game never stores a player name. Name comes from the TRF profile at claim time.

## Prize and leaderboard
- Leaderboard lives on the main site in `fan_quiz_scores` (see Part B).
- Weekly window, Monday 00:00 to Sunday 23:59, Dubai time.
- One counted entry per account per day (the first claimed session of the day), best counted score wins the week.
- Tie-break: more correct answers, then fewer questions answered, then earlier completion.
- Put every prize word behind a `PRIZE_ENABLED` flag, default false.
- Do not ship prize copy until Melo confirms the Dubai promotion permit position and the terms text.

## Phases and gates
1. Scaffold and rules
   - Create the repo structure, a CLAUDE.md with the locked decisions above, env var template, lint and test setup.
   - Stop. Show Melo the file tree.
2. Data and matcher
   - Add `data/questions.json`, the validator, the matcher and its tests.
   - Stop. Report validator output and test results.
3. Server
   - Migration for `fan_quiz_sessions`, the five API routes, rate limiting, session cookie.
   - Stop. Report the migration SQL for Melo to run in Supabase. Do not run it.
4. UI
   - Landing, wheel, question modal, score bar, continue prompt, end screen. Mobile first.
   - Stop. Report what was built and any open issues.
5. Hand-off
   - Token signing and redirect. Then do Part B in the trf-project repo as a separate commit.
   - Stop.
6. Deploy
   - Vercel preview only. Production and the play.thereflectivefootball.com subdomain need Melo's explicit approval.

## Env vars (names only)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server only, never in client code, commits or chat)
- `PLAY_HANDOFF_SECRET` (same value in both Vercel projects)
- `MAIN_SITE_URL`
- `ANSWER_SECONDS`
- `PRIZE_ENABLED`

## Part B: main site (trf-project repo, ~/Desktop/trf-project)
- Add `app/play/claim/page.js` and `app/api/play/claim/route.js`.
- Verify the token signature and expiry. Reject anything else with a friendly page and a link back to the game.
- If signed out, send the player through the existing signup wall and return to the same URL.
- Migration `fan_quiz_scores`: id, user_id, session_id (unique), score, answered, correct, incorrect, completed_at, claimed_at, counted (bool).
- RLS on. Public read of a leaderboard view (display name, score, correct, week). Insert through the server route only.
- Add a `/play` leaderboard page for the current week and last week. No dead ends: it links to the game, films and Ultima.
- Add a door or ribbon on the site only after Melo approves placement.
- Work in small commits and stop for review before pushing.

## Out of scope for now
- Multiplayer, teams, daily doubles, special wedges.
- Native apps and push notifications.
- Any prize payout flow.
