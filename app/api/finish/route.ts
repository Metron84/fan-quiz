import type { NextRequest } from "next/server";
import { canFinish, summarize } from "@/lib/server/game";
import { conflict, fail, limited, loadSession, noSession, ok, saveState } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const blocked = limited(req, "finish", 20);
  if (blocked) return blocked;

  const row = await loadSession(req);
  if (!row) return noSession();

  // Already frozen: replay returns the same summary.
  if (row.completed_at) return ok({ summary: summarize(row.state), handoffUrl: null });
  if (!canFinish(row.state)) return fail(409, "Answer the current question first.", { next: "refresh" });

  const state = { ...row.state, phase: "finished" as const };
  if (!(await saveState(row, state, true))) return conflict();

  // handoffUrl is signed and filled in during Phase 5.
  return ok({ summary: summarize(state), handoffUrl: null });
}
