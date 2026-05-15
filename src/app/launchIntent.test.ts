import { describe, expect, it } from "vitest";
import { getLaunchIntent } from "./launchIntent";

describe("PWA shortcut launch intents", () => {
  it("recognizes the mixed practice shortcut", () => {
    expect(getLaunchIntent("?mode=mixed")).toEqual({ type: "practice", mode: "mixed" });
  });

  it("recognizes the weak notes shortcut", () => {
    expect(getLaunchIntent("?view=weak-notes")).toEqual({ type: "view", view: "weak-notes" });
  });

  it("recognizes known preset shortcuts", () => {
    expect(getLaunchIntent("?preset=common-trumpet-accidentals")).toEqual({
      type: "preset",
      presetId: "common-trumpet-accidentals"
    });
  });

  it("falls back for invalid mode shortcuts", () => {
    expect(getLaunchIntent("?mode=staff-letter")).toBeNull();
  });

  it("falls back for unknown view and preset shortcuts", () => {
    expect(getLaunchIntent("?view=home")).toBeNull();
    expect(getLaunchIntent("?preset=not-real")).toBeNull();
  });
});
