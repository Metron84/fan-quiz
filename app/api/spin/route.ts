import type { NextRequest } from "next/server";
import { QUESTIONS, answerSeconds } from "@/lib/server/bank";
import { applySpin, canSpin, pickSpin, wheel } from "@/lib/server/game";
import { conflict, fail, limited, loadSession, noSession, ok, saveState } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const blocked = limited(req, "spin", 60);
  if (blocked) return blocked;

  const row = await loadSession(req);
  if (!row) return noSession();
  if (!canSpin(row.state)) return fail(409, "Finish the current step first.", { next: "refresh" });

  const q = pickSpin(QUESTIONS, row.state, Math.random);
  if (!q) return fail(409, "You have been through the whole wheel.", { next: "finished" });

  const seconds = answerSeconds();
  const state = applySpin(row.state, q, Date.now(), seconds);
  if (!(await saveState(row, state))) return conflict();

  return ok({
    category: q.category,
    value: q.value,
    questionId: q.id,
    clue: q.clue,
    deadline: state.pending!.deadline,
    answerSeconds: seconds,
    wheel: wheel(state),
    score: state.score,
    answered: state.answered,
  });
}
