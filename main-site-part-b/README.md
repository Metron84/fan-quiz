# Part B: main site changes (Metron84/reflective)

Holds the three commits for the main site while the push to `reflective` is blocked.

- `part-b-reflective.patch`: apply with `git am main-site-part-b/part-b-reflective.patch` from the `reflective` repo root (base: `0d928b4`).
- `0057_fan_quiz_scores.sql`: migration, not yet applied. Melo runs it in the Supabase SQL editor.

Adds `/play`, `/play/claim`, `POST /api/play/claim`, `lib/play/*` and `npm run test:play`.
Delete this folder once the changes are in `reflective`.
