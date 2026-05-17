export function canUseHapticFeedback(): boolean {
  if (typeof navigator === "undefined") return false;
  return typeof navigator.vibrate === "function";
}

export function vibrateAnswerFeedback(isCorrect: boolean, enabled: boolean): boolean {
  if (!enabled || !canUseHapticFeedback()) return false;
  return navigator.vibrate(isCorrect ? 55 : [28, 45, 28]);
}
