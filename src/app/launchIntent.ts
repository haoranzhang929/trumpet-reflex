export type LaunchIntent = "mixed-practice" | "weak-notes";

export function getLaunchIntent(search: string): LaunchIntent | null {
  const params = new URLSearchParams(search);

  if (params.get("mode") === "mixed") return "mixed-practice";
  if (params.get("view") === "weak-notes") return "weak-notes";

  return null;
}
