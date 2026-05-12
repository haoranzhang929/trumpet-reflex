import type { AppSettings, AttemptSpeedClass } from "../../types";

export function classifyAttemptSpeed(
  isCorrect: boolean,
  reactionMs: number,
  thresholds: Pick<AppSettings, "veryFastThresholdMs" | "slowThresholdMs">
): AttemptSpeedClass {
  if (!isCorrect) return "wrong";
  if (reactionMs <= thresholds.veryFastThresholdMs) return "fast-correct";
  if (reactionMs <= thresholds.slowThresholdMs) return "normal-correct";
  return "slow-correct";
}
