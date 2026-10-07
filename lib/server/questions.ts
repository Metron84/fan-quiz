import type { MatchMode } from "./match";

export const MATCH_MODES: readonly MatchMode[] = ["fuzzy", "strict"];
export const CELL_VALUES = [100, 200, 300, 400, 500] as const;

export interface Question {
  id: string;
  category: string;
  value: number;
  clue: string;
  answer: string;
  matchMode: MatchMode;
  tags: string[];
  check: string;
  source: string;
  acceptedAnswers?: string[];
  answerGroups?: string[][];
  requiredCount?: number;
}
