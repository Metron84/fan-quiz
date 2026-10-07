import { describe, expect, it } from "vitest";
import { isCorrect, normalize } from "@/lib/server/match";

const fuzzy = (...a: string[]) => ({ matchMode: "fuzzy" as const, acceptedAnswers: a });
const strict = (...a: string[]) => ({ matchMode: "strict" as const, acceptedAnswers: a });

describe("normalize", () => {
  it("lowercases, strips accents and punctuation, drops leading the", () => {
    expect(normalize("  The Atlético!! ")).toBe("atletico");
    expect(normalize("2013/14")).toBe("2013 14");
    expect(normalize("Stoke-on/Trent")).toBe("stoke on trent");
  });
});

describe("fuzzy", () => {
  const drogba = fuzzy("didier drogba", "drogba");
  it("accepts a surname and punctuation", () => {
    expect(isCorrect("drogba", drogba)).toBe(true);
    expect(isCorrect("Didier Drogba!", drogba)).toBe(true);
  });
  it("accepts a phrase inside a longer input", () => {
    expect(isCorrect("it was Didier Drogba", drogba)).toBe(true);
  });
  it("rejects kain for kane (no typos on 4 chars)", () => {
    expect(isCorrect("kain", fuzzy("kane"))).toBe(false);
    expect(isCorrect("kane", fuzzy("kane"))).toBe(true);
  });
  it("allows one typo on 5 to 8 chars and two on 9 or more", () => {
    expect(isCorrect("lampad", fuzzy("lampard"))).toBe(true);
    expect(isCorrect("lamprd", fuzzy("lampard"))).toBe(true);
    expect(isCorrect("stamford brigde", fuzzy("stamford bridge"))).toBe(true);
    expect(isCorrect("stamfrd bridge", fuzzy("stamford bridge"))).toBe(true);
    expect(isCorrect("stanfrd brigd", fuzzy("stamford bridge"))).toBe(false);
  });
  it("matches an accented Atletico", () => {
    expect(isCorrect("Atlético Madrid", fuzzy("atletico madrid"))).toBe(true);
    expect(isCorrect("Atletico", fuzzy("atletico"))).toBe(true);
  });
  it("drops a leading the on both sides", () => {
    expect(isCorrect("the bridge", fuzzy("the bridge"))).toBe(true);
    expect(isCorrect("bridge", fuzzy("the bridge"))).toBe(true);
  });
  it("rejects empty and wrong answers", () => {
    expect(isCorrect("", drogba)).toBe(false);
    expect(isCorrect("lampard", drogba)).toBe(false);
  });
});

describe("strict", () => {
  const season = strict("2013-14", "2013/14", "2014");
  it("accepts seasons and years", () => {
    expect(isCorrect("2013/14", season)).toBe(true);
    expect(isCorrect("2014", season)).toBe(true);
    expect(isCorrect("in 2014", season)).toBe(true);
  });
  it("rejects near misses", () => {
    expect(isCorrect("2015", season)).toBe(false);
    expect(isCorrect("2013", season)).toBe(false);
    expect(isCorrect("it was 2014", season)).toBe(false);
  });
  it("accepts 80s for the 1980s", () => {
    const dec = strict("1980s", "the 1980s", "80s");
    expect(isCorrect("80s", dec)).toBe(true);
    expect(isCorrect("the 80s", dec)).toBe(true);
    expect(isCorrect("1980s", dec)).toBe(true);
    expect(isCorrect("90s", dec)).toBe(false);
  });
});

describe("answerGroups", () => {
  const spec = {
    matchMode: "fuzzy" as const,
    answerGroups: [["bobby moore", "moore"], ["geoff hurst", "hurst"], ["martin peters", "peters"]],
    requiredCount: 2,
  };
  it("accepts two distinct groups", () => {
    expect(isCorrect("Moore and Hurst", spec)).toBe(true);
    expect(isCorrect("Moore, Peters", spec)).toBe(true);
    expect(isCorrect("Bobby Moore & Geoff Hurst", spec)).toBe(true);
    expect(isCorrect("moore hurst peters", spec)).toBe(true);
  });
  it("rejects one group, even repeated", () => {
    expect(isCorrect("Moore", spec)).toBe(false);
    expect(isCorrect("Bobby Moore, Moore", spec)).toBe(false);
  });
  it("rejects wrong names", () => {
    expect(isCorrect("Moore and Lampard", spec)).toBe(false);
  });
});
