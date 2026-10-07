import { describe, expect, it } from "vitest";
import {
  activeCategories, applyAnswer, applyContinue, applySpin, canFinish, canSpin, eligible,
  newState, pickSpin, summarize, wheel, GRACE_MS, type GameState,
} from "@/lib/server/game";
import type { Question } from "@/lib/server/questions";

const VALUES = [100, 200, 300, 400, 500];
function mk(cat: string, value: number, n: number, extra: Partial<Question> = {}): Question {
  return {
    id: `${cat}-${value}-${n}`, category: cat, value, clue: `clue ${cat} ${value} ${n}`,
    answer: `ans-${cat}-${value}-${n}`, matchMode: "fuzzy", tags: [`tag-${cat}-${value}-${n}`],
    check: "record", source: "s", acceptedAnswers: [`ans ${cat} ${value} ${n}`.toLowerCase()], ...extra,
  };
}
const bank = (cats: string[]) => cats.flatMap((c) => VALUES.flatMap((v) => [0, 1, 2].map((n) => mk(c, v, n))));
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

function play(qs: Question[], state: GameState, correct: boolean, now = 1000) {
  const q = pickSpin(qs, state, seeded(state.answered + 3))!;
  const spun = applySpin(state, q, now, 45);
  const text = correct ? (q.acceptedAnswers as string[])[0] : "nope";
  return { q, res: applyAnswer(qs, spun, text, now + 1000)! };
}

describe("activeCategories", () => {
  it("needs all five values and caps at 8", () => {
    const partial = bank(["A"]).filter((q) => q.value !== 500);
    expect(activeCategories([...partial, ...bank(["B"])])).toEqual(["B"]);
    expect(activeCategories(bank(["1", "2", "3", "4", "5", "6", "7", "8", "9"]))).toHaveLength(8);
  });
});

describe("spin", () => {
  it("removes the used cell and never serves a second question from it", () => {
    const qs = bank(["A", "B"]);
    let s = newState(qs);
    const seen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const { q, res } = play(qs, s, true);
      expect(seen.has(`${q.category}|${q.value}`)).toBe(false);
      seen.add(`${q.category}|${q.value}`);
      s = res.state;
      if (res.next === "continuePrompt") s = applyContinue(qs, s, true)!;
    }
  });
  it("never serves two questions that share a tag or answer", () => {
    const qs = [
      ...bank(["A"]).map((q) => ({ ...q, tags: ["same"], answer: q.answer })),
    ];
    const s = applySpin(newState(qs), qs[0], 0, 45);
    expect(eligible(qs, { ...s, pending: null })).toHaveLength(0);
    const qs2 = bank(["A"]).map((q) => ({ ...q, answer: "same answer" }));
    const s2 = applySpin(newState(qs2), qs2[0], 0, 45);
    expect(eligible(qs2, { ...s2, pending: null })).toHaveLength(0);
  });
  it("cannot spin with a question pending", () => {
    const qs = bank(["A"]);
    const s = applySpin(newState(qs), qs[0], 0, 45);
    expect(canSpin(s)).toBe(false);
  });
  it("greys a category once its five cells are used", () => {
    const qs = bank(["A", "B"]);
    let s = newState(qs);
    s = { ...s, usedCells: VALUES.map((v) => `A|${v}`) };
    expect(wheel(s)).toEqual([{ name: "A", exhausted: true }, { name: "B", exhausted: false }]);
  });
});

describe("answer", () => {
  it("adds on correct and subtracts on incorrect, allowing negatives", () => {
    const qs = bank(["A"]);
    const s0 = newState(qs);
    const q = qs.find((x) => x.value === 300)!;
    const wrong = applyAnswer(qs, applySpin(s0, q, 0, 45), "nope", 1000)!;
    expect(wrong.pointsChange).toBe(-300);
    expect(wrong.state.score).toBe(-300);
    const right = applyAnswer(qs, applySpin(s0, q, 0, 45), (q.acceptedAnswers as string[])[0], 1000)!;
    expect(right.state.score).toBe(300);
  });
  it("counts an answer past deadline plus grace as a timeout", () => {
    const qs = bank(["A"]);
    const q = qs[0];
    const spun = applySpin(newState(qs), q, 0, 45);
    const late = applyAnswer(qs, spun, (q.acceptedAnswers as string[])[0], 45_000 + GRACE_MS + 1)!;
    expect(late.timedOut).toBe(true);
    expect(late.correct).toBe(false);
    const inGrace = applyAnswer(qs, spun, (q.acceptedAnswers as string[])[0], 45_000 + GRACE_MS)!;
    expect(inGrace.correct).toBe(true);
  });
  it("rejects a replayed answer", () => {
    const qs = bank(["A"]);
    const spun = applySpin(newState(qs), qs[0], 0, 45);
    const first = applyAnswer(qs, spun, "x", 1000)!;
    expect(applyAnswer(qs, first.state, "x", 1000)).toBeNull();
  });
});

describe("flow", () => {
  it("asks to continue after question 5, then caps at 10", () => {
    const qs = bank(["A", "B", "C"]);
    let s = newState(qs);
    let next = "spin";
    for (let i = 1; i <= 5; i++) {
      const r = play(qs, s, i % 2 === 0).res;
      s = r.state;
      next = r.next;
    }
    expect(next).toBe("continuePrompt");
    expect(canSpin(s)).toBe(false);
    s = applyContinue(qs, s, true)!;
    expect(canSpin(s)).toBe(true);
    for (let i = 6; i <= 10; i++) {
      const r = play(qs, s, true).res;
      s = r.state;
      next = r.next;
    }
    expect(next).toBe("finished");
    expect(s.answered).toBe(10);
    expect(canSpin(s)).toBe(false);
  });
  it("finishes on no and summarises", () => {
    const qs = bank(["A", "B", "C"]);
    let s = newState(qs);
    for (let i = 1; i <= 5; i++) s = play(qs, s, i <= 3).res.state;
    s = applyContinue(qs, s, false)!;
    expect(s.phase).toBe("finished");
    expect(canFinish(s)).toBe(true);
    const sum = summarize(s);
    expect(sum).toMatchObject({ answered: 5, correct: 3, incorrect: 2 });
    expect(sum.averagePoints).toBe(Math.round((sum.score / 5) * 10) / 10);
  });
  it("only allows continue in the continue phase", () => {
    const qs = bank(["A"]);
    expect(applyContinue(qs, newState(qs), true)).toBeNull();
  });
});
