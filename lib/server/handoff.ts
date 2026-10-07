import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import type { GameState } from "./game";
import { summarize } from "./game";

export const HANDOFF_TTL_SECONDS = 15 * 60;

export interface HandoffClaims {
  sid: string;
  score: number;
  answered: number;
  correct: number;
  incorrect: number;
  completedAt: string;
  nonce: string;
  exp: number; // epoch seconds
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** HS256 JWT, built with node crypto so there is nothing extra to trust. */
export function signHandoff(claims: HandoffClaims, secret: string): string {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(claims));
  const sig = createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function buildClaims(sid: string, state: GameState, completedAt: string, nowMs = Date.now()): HandoffClaims {
  const s = summarize(state);
  return {
    sid,
    score: s.score,
    answered: s.answered,
    correct: s.correct,
    incorrect: s.incorrect,
    completedAt,
    nonce: randomBytes(12).toString("base64url"),
    exp: Math.floor(nowMs / 1000) + HANDOFF_TTL_SECONDS,
  };
}

/** Returns the claim URL, or null when the secret is not configured. */
export function handoffUrl(sid: string, state: GameState, completedAt: string): string | null {
  const secret = process.env.PLAY_HANDOFF_SECRET;
  if (!secret) return null;
  const base = (process.env.MAIN_SITE_URL || "https://thereflectivefootball.com").replace(/\/$/, "");
  const token = signHandoff(buildClaims(sid, state, completedAt), secret);
  return `${base}/play/claim?t=${encodeURIComponent(token)}`;
}
