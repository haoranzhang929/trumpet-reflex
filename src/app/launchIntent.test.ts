import { describe, expect, it } from "vitest";
import { getLaunchIntent } from "./launchIntent";

describe("PWA shortcut launch intents", () => {
  it("recognizes the mixed practice shortcut", () => {
    expect(getLaunchIntent("?mode=mixed")).toBe("mixed-practice");
  });

  it("recognizes the weak notes shortcut", () => {
    expect(getLaunchIntent("?view=weak-notes")).toBe("weak-notes");
  });

  it("keeps normal launches unchanged", () => {
    expect(getLaunchIntent("")).toBeNull();
    expect(getLaunchIntent("?view=home")).toBeNull();
  });
});
