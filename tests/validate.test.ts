import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateQuestions } from "@/lib/server/validate";

const base = {
  id: "t-100-c1", category: "T", value: 100, clue: "A clue.", answer: "Foo",
  matchMode: "fuzzy", tags: ["a"], check: "record", source: "s", acceptedAnswers: ["foo"],
};
const cell = (value: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({ ...base, id: `t-${value}-c${i}`, value }));
const fullSet = () => [100, 200, 300, 400, 500].flatMap((v) => cell(v, 3));
const errors = (d: unknown) => validateQuestions(d).filter((i) => i.level === "error").map((i) => i.message);

describe("validateQuestions", () => {
  it("passes a clean set", () => {
    expect(errors(fullSet())).toEqual([]);
  });
  it("flags duplicate ids", () => {
    const d = fullSet();
    d[1] = { ...d[1], id: d[0].id };
    expect(errors(d)).toContain("duplicate id");
  });
  it("errors on an empty cell and warns on a thin one", () => {
    const d = fullSet().filter((q) => q.value !== 300);
    expect(errors(d)).toContain("cell has 0 variants");
    const thin = fullSet().filter((q) => q.id !== "t-100-c2");
    expect(validateQuestions(thin).some((i) => i.level === "warn")).toBe(true);
  });
  it("flags an answer equal to the category", () => {
    const d = fullSet();
    d[0] = { ...d[0], acceptedAnswers: ["T"] };
    expect(errors(d).some((m) => m.startsWith("accepted answer equals category"))).toBe(true);
  });
  it("flags an answer inside its clue", () => {
    const d = fullSet();
    d[0] = { ...d[0], clue: "This is about foo today." };
    expect(errors(d).some((m) => m.startsWith("accepted answer appears in clue"))).toBe(true);
  });
  it("flags missing fields and unknown matchMode", () => {
    const d = fullSet();
    d[0] = { ...d[0], source: "" , matchMode: "loose" };
    const e = errors(d);
    expect(e).toContain("missing field: source");
    expect(e).toContain("unknown matchMode: loose");
  });
  it("flags an em-dash in a clue", () => {
    const d = fullSet();
    d[0] = { ...d[0], clue: "A clue — here." };
    expect(errors(d)).toContain("em-dash in clue");
  });
  it("passes the real question set", () => {
    const real = JSON.parse(readFileSync(join(process.cwd(), "data", "questions.json"), "utf8"));
    expect(errors(real)).toEqual([]);
  });
});
