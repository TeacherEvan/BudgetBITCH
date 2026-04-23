import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineBanner } from "./offline-banner";

describe("OfflineBanner", () => {
  it("explains which tools stay available offline and which routes still need sync", () => {
    render(<OfflineBanner />);

    expect(screen.getByText(/notes, calculator, and launch settings stay available on this device/i)).toBeInTheDocument();
    expect(
      screen.getByText(/dashboard, jobs, integrations, and other sync-required routes still need a live connection/i),
    ).toBeInTheDocument();
  });
});