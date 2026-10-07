import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "./supabase";
import { clientIp, rateLimit } from "./rate-limit";
import type { GameState } from "./game";

export const COOKIE = "fq_sid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Row {
  id: string;
  state: GameState;
  version: number;
  completed_at: string | null;
}

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "no-store" } });

export const ok = (body: Record<string, unknown>) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });

/** Returns a 429 response when the caller is over the limit, otherwise null. */
export function limited(req: NextRequest, route: string, limit: number) {
  return rateLimit(clientIp(req.headers), route, limit) ? null : fail(429, "Easy there. Try again in a moment.");
}

export function setCookie(res: NextResponse, id: string) {
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 6,
  });
  return res;
}

export async function loadSession(req: NextRequest): Promise<Row | null> {
  const id = req.cookies.get(COOKIE)?.value;
  if (!id || !UUID.test(id)) return null;
  const { data } = await db()
    .from("fan_quiz_sessions")
    .select("id,state,version,completed_at")
    .eq("id", id)
    .maybeSingle();
  return (data as Row | null) ?? null;
}

/** Single update guarded by the version we read. False means another request got there first. */
export async function saveState(row: Row, state: GameState, completed = false): Promise<boolean> {
  const patch: Record<string, unknown> = { state, version: row.version + 1 };
  if (completed) patch.completed_at = new Date().toISOString();
  const { data, error } = await db()
    .from("fan_quiz_sessions")
    .update(patch)
    .eq("id", row.id)
    .eq("version", row.version)
    .select("id");
  return !error && !!data?.length;
}

export const noSession = () => fail(404, "Your game was not found. Start a new one.", { next: "newGame" });
export const conflict = () => fail(409, "That one was already handled. Carry on.", { next: "refresh" });
