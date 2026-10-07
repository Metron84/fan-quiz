import type { NextRequest } from "next/server";
import { QUESTIONS, answerSeconds } from "@/lib/server/bank";
import { MAX_QUESTIONS, CONTINUE_AFTER, newState, wheel } from "@/lib/server/game";
import { db } from "@/lib/server/supabase";
import { fail, limited, ok, setCookie } from "@/lib/server/session";

export async function POST(req: NextRequest) {
  const blocked = limited(req, "session", 10);
  if (blocked) return blocked;

  const state = newState(QUESTIONS);
  if (!state.categories.length) return fail(503, "The wheel is warming up. Try again soon.");

  const { data, error } = await db().from("fan_quiz_sessions").insert({ state }).select("id").single();
  if (error || !data) return fail(500, "Could not start a game. Try again.");

  return setCookie(
    ok({
      categories: wheel(state),
      score: 0,
      answered: 0,
      maxQuestions: MAX_QUESTIONS,
      continueAfter: CONTINUE_AFTER,
      answerSeconds: answerSeconds(),
      next: "spin",
    }),
    data.id,
  );
}
