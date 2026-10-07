import type { NextRequest } from "next/server";
import { QUESTIONS } from "@/lib/server/bank";
import { applyContinue, wheel } from "@/lib/server/game";
import { conflict, fail, limited, loadSession, noSession, ok, saveState } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const blocked = limited(req, "continue", 30);
  if (blocked) return blocked;

  const body = await req.json().catch(() => null);
  const choice = body?.choice;
  if (choice !== "yes" && choice !== "no") return fail(400, "Choose yes or no.");

  const row = await loadSession(req);
  if (!row) return noSession();

  const state = applyContinue(QUESTIONS, row.state, choice === "yes");
  if (!state) return conflict();
  if (!(await saveState(row, state))) return conflict();

  return ok({
    next: state.phase === "spin" ? "spin" : "finished",
    wheel: wheel(state),
    score: state.score,
    answered: state.answered,
  });
}
