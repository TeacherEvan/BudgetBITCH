import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LaunchWizard, { LAUNCH_PROFILE_STORAGE_KEY } from "./launch-wizard";

describe("LaunchWizard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("captures the window choices and stores a completed launch profile", () => {
    const onComplete = vi.fn();

    render(<LaunchWizard onComplete={onComplete} />);

    expect(screen.getByText(/no precise location data is collected/i)).toBeInTheDocument();
    expect(screen.getByText(/crypto platform choice is a placeholder for later/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/city/i), { target: { value: "Dublin" } });
    fireEvent.change(screen.getByLabelText(/visual style/i), { target: { value: "billboard" } });
    fireEvent.change(screen.getByLabelText(/motion level/i), { target: { value: "cinematic" } });
    fireEvent.change(screen.getByLabelText(/theme/i), { target: { value: "midnight" } });
    fireEvent.change(screen.getByLabelText(/crypto platform placeholder/i), {
      target: { value: "kraken" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save launch settings/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        city: "Dublin",
        layoutPreset: "billboard",
        motionPreset: "cinematic",
        themePreset: "midnight",
        cryptoPlatform: "kraken",
      }),
    );

    expect(JSON.parse(window.localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY) ?? "null")).toMatchObject(
      {
        completed: true,
        city: "Dublin",
        layoutPreset: "billboard",
        motionPreset: "cinematic",
        themePreset: "midnight",
        cryptoPlatform: "kraken",
      },
    );
  });
});
