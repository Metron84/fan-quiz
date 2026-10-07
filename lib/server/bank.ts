import "server-only";
import raw from "@/data/questions.json";
import type { Question } from "./questions";

/** The full question bank, answers included. Never import this from a client component. */
export const QUESTIONS = raw as Question[];

export const answerSeconds = (): number => {
  const n = Number(process.env.ANSWER_SECONDS);
  return Number.isFinite(n) && n > 0 ? n : 45;
};
