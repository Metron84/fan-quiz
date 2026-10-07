import { isCorrect } from "./match";
import { CELL_VALUES, type Question } from "./questions";

export const MAX_QUESTIONS = 10;
export const CONTINUE_AFTER = 5;
export const MAX_CATEGORIES = 8;
export const GRACE_MS = 2000;

export type Phase = "spin" | "question" | "continue" | "finished";

export interface Pending {
  questionId: string;
  category: string;
  value: number;
  deadline: number; // epoch ms
}

export interface AnswerLog {
  questionId: string;
  category: string;
  value: number;
  correct: boolean;
  timedOut: boolean;
  pointsChange: number;
}

export interface GameState {
  phase: Phase;
  categories: string[];
  usedCells: string[];
  served: string[];
  pending: Pending | null;
  answers: AnswerLog[];
  score: number;
  answered: number;
  continued: boolean;
}

export type Random = () => number;

export const cellKey = (category: string, value: number) => `${category}|${value}`;

/** Categories where each of the five values has at least one question, capped at 8. */
export function activeCategories(qs: Question[]): string[] {
  const byCat = new Map<string, Set<number>>();
  for (const q of qs) {
    if (!byCat.has(q.category)) byCat.set(q.category, new Set());
    byCat.get(q.category)!.add(q.value);
  }
  return [...byCat.entries()]
    .filter(([, vals]) => CELL_VALUES.every((v) => vals.has(v)))
    .map(([c]) => c)
    .slice(0, MAX_CATEGORIES);
}

export function newState(qs: Question[]): GameState {
  return {
    phase: "spin",
    categories: activeCategories(qs),
    usedCells: [],
    served: [],
    pending: null,
    answers: [],
    score: 0,
    answered: 0,
    continued: false,
  };
}

/** Questions that can still be served: unused cell, no shared tag, no repeated answer. */
export function eligible(qs: Question[], state: GameState): Question[] {
  const byId = new Map(qs.map((q) => [q.id, q]));
  const servedQs = state.served.map((id) => byId.get(id)).filter((q): q is Question => !!q);
  const tags = new Set(servedQs.flatMap((q) => q.tags));
  const answers = new Set(servedQs.map((q) => q.answer));
  return qs.filter(
    (q) =>
      state.categories.includes(q.category) &&
      !state.usedCells.includes(cellKey(q.category, q.value)) &&
      !state.served.includes(q.id) &&
      !answers.has(q.answer) &&
      !q.tags.some((t) => tags.has(t)),
  );
}

/** A category leaves the wheel once all five of its cells are used. */
export function wheel(state: GameState): { name: string; exhausted: boolean }[] {
  return state.categories.map((name) => ({
    name,
    exhausted: CELL_VALUES.every((v) => state.usedCells.includes(cellKey(name, v))),
  }));
}

const pick = <T,>(xs: T[], rand: Random): T => xs[Math.min(xs.length - 1, Math.floor(rand() * xs.length))];

/** Land on a category, then a random unused value in it, then one variant at random. */
export function pickSpin(qs: Question[], state: GameState, rand: Random): Question | null {
  const pool = eligible(qs, state);
  if (!pool.length) return null;
  const category = pick([...new Set(pool.map((q) => q.category))], rand);
  const inCat = pool.filter((q) => q.category === category);
  const value = pick([...new Set(inCat.map((q) => q.value))], rand);
  return pick(
    inCat.filter((q) => q.value === value),
    rand,
  );
}

export function canSpin(state: GameState): boolean {
  return state.phase === "spin" && !state.pending && state.answered < MAX_QUESTIONS;
}

export function applySpin(state: GameState, q: Question, now: number, answerSeconds: number): GameState {
  return {
    ...state,
    phase: "question",
    usedCells: [...state.usedCells, cellKey(q.category, q.value)],
    served: [...state.served, q.id],
    pending: { questionId: q.id, category: q.category, value: q.value, deadline: now + answerSeconds * 1000 },
  };
}

export type NextStep = "spin" | "continuePrompt" | "finished";

export interface AnswerResult {
  state: GameState;
  correct: boolean;
  timedOut: boolean;
  pointsChange: number;
  next: NextStep;
}

export function applyAnswer(qs: Question[], state: GameState, text: string, now: number): AnswerResult | null {
  const p = state.pending;
  if (state.phase !== "question" || !p) return null;
  const q = qs.find((x) => x.id === p.questionId);
  if (!q) return null;
  const timedOut = now > p.deadline + GRACE_MS;
  const correct = !timedOut && isCorrect(text, q);
  const pointsChange = correct ? p.value : -p.value;
  const answered = state.answered + 1;
  const base: GameState = {
    ...state,
    pending: null,
    score: state.score + pointsChange,
    answered,
    answers: [
      ...state.answers,
      { questionId: q.id, category: q.category, value: p.value, correct, timedOut, pointsChange },
    ],
  };
  let next: NextStep;
  if (answered >= MAX_QUESTIONS || !eligible(qs, base).length) next = "finished";
  else if (answered === CONTINUE_AFTER && !state.continued) next = "continuePrompt";
  else next = "spin";
  const phase: Phase = next === "spin" ? "spin" : next === "continuePrompt" ? "continue" : "finished";
  return { state: { ...base, phase }, correct, timedOut, pointsChange, next };
}

export function applyContinue(qs: Question[], state: GameState, yes: boolean): GameState | null {
  if (state.phase !== "continue") return null;
  if (!yes || !eligible(qs, state).length) return { ...state, phase: "finished", continued: true };
  return { ...state, phase: "spin", continued: true };
}

export interface Summary {
  score: number;
  answered: number;
  correct: number;
  incorrect: number;
  averagePoints: number;
}

export function summarize(state: GameState): Summary {
  const correct = state.answers.filter((a) => a.correct).length;
  return {
    score: state.score,
    answered: state.answered,
    correct,
    incorrect: state.answered - correct,
    averagePoints: state.answered ? Math.round((state.score / state.answered) * 10) / 10 : 0,
  };
}

/** Finish is allowed any time no question is pending. */
export function canFinish(state: GameState): boolean {
  return !state.pending && state.phase !== "question";
}
