import { drillPresets } from "../data/drillPresets";

export type LaunchIntent =
  | { type: "practice"; mode: "mixed" }
  | { type: "view"; view: "weak-notes" }
  | { type: "preset"; presetId: string };

export function getLaunchIntent(search: string): LaunchIntent | null {
  const params = new URLSearchParams(search);
  const presetId = params.get("preset");

  if (params.get("mode") === "mixed") return { type: "practice", mode: "mixed" };
  if (params.get("view") === "weak-notes") return { type: "view", view: "weak-notes" };
  if (presetId && drillPresets.some((preset) => preset.id === presetId)) return { type: "preset", presetId };

  return null;
}
