"use client";

import { useCallback, useState } from "react";
import type { AnswerResult, FinishResult, SessionStart, SpinResult, WheelSegment } from "@/lib/api-types";
import { FILMS_URL } from "@/lib/links";
import { EndScreen } from "./EndScreen";
import { QuestionModal } from "./QuestionModal";
import { ScoreBar } from "./ScoreBar";
import { Wheel } from "./Wheel";

type Stage = "landing" | "playing" | "end";
type Beat = "idle" | "spinning" | "reveal" | "question";

async function post<T>(path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string; next?: string } }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { ok: res.ok, status: res.status, data: await res.json() };
  } catch {
    return { ok: false, status: 0, data: { error: "No connection. Check your signal and try again." } as never };
  }
}

export function Game() {
  const [stage, setStage] = useState<Stage>("landing");
  const [beat, setBeat] = useState<Beat>("idle");
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  const [meta, setMeta] = useState({ max: 10 });
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [spin, setSpin] = useState<SpinResult | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [finish, setFinish] = useState<FinishResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);

  const fatal = (msg: string) => {
    setError(msg);
    setStuck(true);
    setBusy(false);
  };

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    setStuck(false);
    const r = await post<SessionStart>("/api/session");
    if (!r.ok) {
      setBusy(false);
      setStage("landing");
      setError(r.data.error ?? "Could not start. Try again.");
      return;
    }
    setSegments(r.data.categories);
    setMeta({ max: r.data.maxQuestions });
    setScore(0);
    setAnswered(0);
    setSpin(null);
    setTarget(null);
    setResult(null);
    setFinish(null);
    setBeat("idle");
    setStage("playing");
    setBusy(false);
  }, []);

  async function doSpin() {
    setBusy(true);
    setError(null);
    setResult(null);
    const r = await post<SpinResult>("/api/spin");
    if (!r.ok) {
      if (r.data.next === "finished") return void endGame();
      return fatal(r.data.error ?? "Could not spin. Start a new game.");
    }
    setSpin(r.data);
    setBeat("spinning");
    setTarget(r.data.category);
  }

  function wheelDone() {
    setSegments((prev) => spin?.wheel ?? prev);
    setBeat("reveal");
    setTimeout(() => {
      setBeat("question");
      setBusy(false);
    }, 900);
  }

  async function submit(text: string, honeypot: string) {
    setBusy(true);
    setError(null);
    const r = await post<AnswerResult>("/api/answer", { answer: text, website: honeypot });
    if (!r.ok) return fatal(r.data.error ?? "Could not check that answer. Start a new game.");
    setResult(r.data);
    setScore(r.data.score);
    setAnswered(r.data.answered);
    setSegments(r.data.wheel);
    setBusy(false);
  }

  async function endGame() {
    setBusy(true);
    const r = await post<FinishResult>("/api/finish");
    if (!r.ok) return fatal(r.data.error ?? "Could not finish. Start a new game.");
    setFinish(r.data);
    setBeat("idle");
    setSpin(null);
    setTarget(null);
    setStage("end");
    setBusy(false);
  }

  function next() {
    if (!result) return;
    if (result.next === "finished") return void endGame();
    setSpin(null);
    setTarget(null);
    setResult(null);
    setBeat("idle");
  }

  async function onContinue(yes: boolean) {
    setBusy(true);
    const r = await post<{ next: "spin" | "finished"; wheel: WheelSegment[] }>("/api/continue", { choice: yes ? "yes" : "no" });
    if (!r.ok) return fatal(r.data.error ?? "Could not continue. Start a new game.");
    if (r.data.next === "finished") return void endGame();
    setSegments(r.data.wheel);
    setBusy(false);
    setSpin(null);
    setTarget(null);
    setResult(null);
    setBeat("idle");
  }

  if (stage === "landing") {
    return (
      <section className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-navy/70">The Reflective Football</p>
        <h1 className="mt-3 text-5xl font-black leading-[1.02]">Are You Really a Fan?</h1>
        <p className="mt-4 text-lg font-semibold">Spin the wheel. Answer the clue. Prove it.</p>
        <ul className="mt-5 space-y-1 text-base">
          <li>Up to 10 questions.</li>
          <li>Right answers add points. Wrong ones take them away.</li>
          <li>No sign-up needed to play.</li>
        </ul>
        <button onClick={start} disabled={busy} className="mt-8 rounded-lg bg-signal px-5 py-4 text-lg font-bold text-cream disabled:opacity-50">
          {busy ? "Getting the wheel ready" : "Play now"}
        </button>
        {error && <p className="mt-3 text-sm font-semibold">{error}</p>}
        <a href={FILMS_URL} className="mt-4 text-center text-base font-bold underline underline-offset-4">
          Watch films on TRF
        </a>
        <p className="mt-10 text-sm font-semibold text-navy/60">Football is nothing without the fans.</p>
      </section>
    );
  }

  if (stage === "end" && finish) {
    return <EndScreen finish={finish} onAgain={start} />;
  }

  const spinning = beat === "spinning";
  return (
    <>
      <ScoreBar score={score} answered={answered} max={meta.max} />
      <section className="mx-auto flex max-w-md flex-col items-center px-5 pb-10 pt-8">
        <Wheel segments={segments} target={target} onDone={wheelDone} />
        <div className="mt-6 flex h-16 items-center justify-center" aria-live="polite">
          {beat === "reveal" && spin && (
            <p className="chip-flip rounded-lg bg-navy px-5 py-3 text-xl font-black text-cream">
              {spin.category} <span className="text-cream">·</span> {spin.value}
            </p>
          )}
        </div>
        <button
          onClick={doSpin}
          disabled={busy || spinning || beat !== "idle" || stuck}
          className="mt-2 w-full rounded-lg bg-signal px-5 py-4 text-lg font-bold text-cream disabled:opacity-40"
        >
          {spinning ? "Spinning" : "Spin"}
        </button>
        {error && !stuck && <p className="mt-3 text-sm font-semibold">{error}</p>}
      </section>

      {beat === "question" && spin && (
        <QuestionModal
          key={spin.questionId}
          question={spin}
          result={result}
          busy={busy}
          error={stuck ? null : error}
          onSubmit={submit}
          onNext={next}
          onContinue={onContinue}
        />
      )}

      {stuck && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-navy/70 sm:items-center" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-md rounded-t-2xl bg-cream p-5 sm:rounded-2xl">
            <p className="text-lg font-bold">{error}</p>
            <button onClick={start} className="mt-4 w-full rounded-lg bg-signal px-4 py-3 text-base font-bold text-cream">
              Start a new game
            </button>
            <a href={FILMS_URL} className="mt-3 block text-center text-base font-bold underline underline-offset-4">
              Watch films on TRF
            </a>
          </div>
        </div>
      )}
    </>
  );
}
