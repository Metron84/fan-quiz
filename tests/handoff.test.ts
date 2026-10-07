import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

const { buildClaims, signHandoff, HANDOFF_TTL_SECONDS } = await import("@/lib/server/handoff");
const { newState } = await import("@/lib/server/game");

describe("handoff token", () => {
  const state = {
    ...newState([]),
    score: -100,
    answered: 3,
    answers: [
      { questionId: "a", category: "A", value: 100, correct: true, timedOut: false, pointsChange: 100 },
      { questionId: "b", category: "A", value: 200, correct: false, timedOut: false, pointsChange: -200 },
      { questionId: "c", category: "A", value: 0, correct: false, timedOut: true, pointsChange: 0 },
    ],
  };

  it("signs HS256 with the expected claims and a 15 minute expiry", () => {
    const now = 1_700_000_000_000;
    const claims = buildClaims("sid-1", state, "2026-10-07T00:00:00.000Z", now);
    expect(claims).toMatchObject({ sid: "sid-1", score: -100, answered: 3, correct: 1, incorrect: 2 });
    expect(claims.exp).toBe(1_700_000_000 + HANDOFF_TTL_SECONDS);
    const token = signHandoff(claims, "secret");
    const [h, b, sig] = token.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({ alg: "HS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(b, "base64url").toString())).toEqual(claims);
    expect(sig).toBe(createHmac("sha256", "secret").update(`${h}.${b}`).digest("base64url"));
  });
  it("uses a fresh nonce each time", () => {
    const a = buildClaims("s", state, "t");
    const b = buildClaims("s", state, "t");
    expect(a.nonce).not.toBe(b.nonce);
  });
});
