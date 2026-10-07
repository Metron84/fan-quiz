// Shapes the browser receives. Nothing here can carry an answer before the player answers.
export type Next = "spin" | "continuePrompt" | "finished";

export interface WheelSegment {
  name: string;
  exhausted: boolean;
}

export interface SessionStart {
  categories: WheelSegment[];
  score: number;
  answered: number;
  maxQuestions: number;
  continueAfter: number;
  answerSeconds: number;
  next: "spin";
}

export interface SpinResult {
  category: string;
  value: number;
  questionId: string;
  clue: string;
  deadline: number;
  answerSeconds: number;
  wheel: WheelSegment[];
  score: number;
  answered: number;
}

export interface AnswerResult {
  correct: boolean;
  timedOut: boolean;
  pointsChange: number;
  score: number;
  answered: number;
  answer: string;
  wheel: WheelSegment[];
  next: Next;
}

export interface Summary {
  score: number;
  answered: number;
  correct: number;
  incorrect: number;
  averagePoints: number;
}

export interface FinishResult {
  summary: Summary;
  handoffUrl: string | null;
}
