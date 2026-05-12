export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  if (!ms) return "0.0s";
  return `${(ms / 1000).toFixed(1)}s`;
}
