import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../storage/settingsStorage";
import { SettingsView } from "./SettingsView";

const noop = vi.fn();

function renderSettings() {
  return render(
    <SettingsView
      settings={{ ...defaultSettings, language: "en" }}
      onChange={noop}
      onExport={noop}
      onImport={noop}
      onReset={noop}
    />
  );
}

describe("SettingsView", () => {
  it("disables haptic feedback when the browser has no vibration API", () => {
    Object.defineProperty(navigator, "vibrate", { value: undefined, configurable: true });

    renderSettings();

    expect(screen.getByText("This browser does not support web vibration feedback. iPhone Safari and iOS PWAs currently cannot use it.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Haptic answer feedback/ })).toBeDisabled();
  });

  it("keeps haptic feedback available when the vibration API exists", () => {
    Object.defineProperty(navigator, "vibrate", { value: vi.fn(() => true), configurable: true });

    renderSettings();

    expect(screen.getByRole("checkbox", { name: "Haptic answer feedback" })).toBeEnabled();
  });
});
