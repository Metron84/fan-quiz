import type { NextRequest } from "next/server";
import { canFinish, summarize } from "@/lib/server/game";
import { handoffUrl } from "@/lib/server/handoff";
import { conflict, fail, limited, loadSession, noSession, ok, saveState } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const blocked = limited(req, "finish", 20);
  if (blocked) return blocked;

  const row = await loadSession(req);
  if (!row) return noSession();

  // Already frozen: replay returns the same summary with a fresh token.
  if (row.completed_at) {
    return ok({ summary: summarize(row.state), handoffUrl: handoffUrl(row.id, row.state, row.completed_at) });
  }
  if (!canFinish(row.state)) return fail(409, "Answer the current question first.", { next: "refresh" });

  const state = { ...row.state, phase: "finished" as const };
  const completedAt = new Date().toISOString();
  if (!(await saveState(row, state, completedAt))) return conflict();

  return ok({ summary: summarize(state), handoffUrl: handoffUrl(row.id, state, completedAt) });
}
