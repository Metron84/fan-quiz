export function ScoreBar({ score, answered, max }: { score: number; answered: number; max: number }) {
  return (
    <div className="sticky top-0 z-20 border-b border-navy/15 bg-cream/95 backdrop-blur" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-md items-end justify-between px-5 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-navy/60">Score</p>
          <p className="text-3xl font-black leading-none tabular-nums" data-testid="score">
            {score}
          </p>
        </div>
        <p className="text-sm font-semibold text-navy/70 tabular-nums">
          Question {Math.min(answered + 1, max)} of {max}
        </p>
      </div>
    </div>
  );
}
