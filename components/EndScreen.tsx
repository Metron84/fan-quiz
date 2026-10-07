import type { FinishResult } from "@/lib/api-types";
import { FILMS_URL } from "@/lib/links";

export function EndScreen({ finish, onAgain }: { finish: FinishResult; onAgain: () => void }) {
  const s = finish.summary;
  const stats: [string, string | number][] = [
    ["Questions answered", s.answered],
    ["Correct", s.correct],
    ["Incorrect", s.incorrect],
    ["Average points per question", s.averagePoints],
  ];
  return (
    <section className="mx-auto max-w-md px-5 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-navy/60">Full time</p>
      <p className="mt-2 text-7xl font-black leading-none tabular-nums" data-testid="final-score">
        {s.score}
      </p>
      <p className="mt-1 text-base font-semibold">points</p>
      <dl className="mt-6 divide-y divide-navy/15 border-y border-navy/15">
        {stats.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between py-3">
            <dt className="text-sm font-semibold text-navy/70">{k}</dt>
            <dd className="text-xl font-black tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-col gap-3">
        {finish.handoffUrl ? (
          <a href={finish.handoffUrl} className="rounded-lg bg-signal px-4 py-3 text-center text-base font-bold text-cream">
            Save score
          </a>
        ) : (
          <p className="rounded-lg border-2 border-dashed border-navy/30 px-4 py-3 text-center text-sm font-semibold">
            Saving scores opens soon. Play again or watch the films while you wait.
          </p>
        )}
        <button onClick={onAgain} className="rounded-lg bg-navy px-4 py-3 text-base font-bold text-cream">
          Play again
        </button>
        <a href={FILMS_URL} className="rounded-lg border-2 border-navy px-4 py-3 text-center text-base font-bold">
          Watch films on TRF
        </a>
      </div>
    </section>
  );
}
