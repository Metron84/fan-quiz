"use client";

import { useEffect, useRef, useState } from "react";
import type { AnswerResult, SpinResult } from "@/lib/api-types";

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function speechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function QuestionModal({
  question,
  result,
  busy,
  error,
  onSubmit,
  onNext,
  onContinue,
}: {
  question: SpinResult;
  result: AnswerResult | null;
  busy: boolean;
  error: string | null;
  onSubmit: (text: string, honeypot: string) => void;
  onNext: () => void;
  onContinue: (yes: boolean) => void;
}) {
  const [text, setText] = useState("");
  const [trap, setTrap] = useState("");
  const [left, setLeft] = useState(question.answerSeconds);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const textRef = useRef("");
  const trapRef = useRef("");
  const submitted = useRef(false);
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  textRef.current = text;
  trapRef.current = trap;

  useEffect(() => setCanSpeak(!!speechCtor()), []);

  // Countdown. At zero the answer goes in as-is and the server marks it a timeout if it is late.
  useEffect(() => {
    if (result) return;
    const end = Date.now() + question.answerSeconds * 1000;
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !submitted.current) {
        submitted.current = true;
        submitRef.current(textRef.current, trapRef.current);
      }
    }, 250);
    return () => clearInterval(tick);
  }, [question.questionId, question.answerSeconds, result]);

  function send() {
    if (submitted.current || busy) return;
    submitted.current = true;
    onSubmit(text, trap);
  }

  function speak() {
    const Ctor = speechCtor();
    if (!Ctor || listening) return;
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.onresult = (e) => setText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const urgent = left <= 10 && !result;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-navy/70 sm:items-center" role="dialog" aria-modal="true" aria-label="Question">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-cream p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-navy/70">
            {question.category} · {question.value}
          </p>
          {!result && (
            <p className={`text-2xl font-black tabular-nums ${urgent ? "text-signal" : ""}`} aria-label={`${left} seconds left`}>
              {left}
            </p>
          )}
        </div>
        <p className="mt-4 text-xl font-bold leading-snug">{question.clue}</p>

        {!result ? (
          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="answer" className="sr-only">
              Your answer
            </label>
            <input
              id="answer"
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={200}
              placeholder="Type your answer"
              className="w-full rounded-lg border-2 border-navy bg-white px-4 py-3 text-lg outline-none focus:border-signal"
            />
            <input
              name="website"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />
            <div className="mt-3 flex gap-3">
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="flex-1 rounded-lg bg-navy px-4 py-3 text-base font-bold text-cream disabled:opacity-40"
              >
                Answer
              </button>
              {canSpeak && (
                <button
                  type="button"
                  onClick={speak}
                  className="rounded-lg border-2 border-navy px-4 py-3 text-base font-bold"
                >
                  {listening ? "Listening" : "Tap to speak"}
                </button>
              )}
            </div>
            {error && <p className="mt-3 text-sm font-semibold text-navy">{error}</p>}
          </form>
        ) : (
          <div className="mt-5" aria-live="polite">
            <p className={`text-2xl font-black ${result.correct ? "" : "text-navy"}`}>
              {result.timedOut ? "Time is up" : result.correct ? "Correct" : "Not this time"}{" "}
              <span className={result.correct ? "text-signal" : ""}>
                {result.pointsChange > 0 ? `+${result.pointsChange}` : result.pointsChange}
              </span>
            </p>
            <p className="mt-2 text-base">
              The answer: <span className="font-bold">{result.answer}</span>
            </p>
            {result.next === "continuePrompt" ? (
              <div className="mt-5">
                <p className="text-lg font-bold">Do you want to continue?</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => onContinue(true)} disabled={busy} className="flex-1 rounded-lg bg-signal px-4 py-3 text-base font-bold text-cream disabled:opacity-40">
                    Yes
                  </button>
                  <button onClick={() => onContinue(false)} disabled={busy} className="flex-1 rounded-lg border-2 border-navy px-4 py-3 text-base font-bold disabled:opacity-40">
                    No
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={onNext} disabled={busy} className="mt-5 w-full rounded-lg bg-signal px-4 py-3 text-base font-bold text-cream disabled:opacity-40">
                {result.next === "finished" ? "See your score" : "Spin again"}
              </button>
            )}
            {error && <p className="mt-3 text-sm font-semibold">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
