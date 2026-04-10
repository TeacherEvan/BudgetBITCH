import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BroadcastBar } from "./broadcast-bar";

describe("BroadcastBar", () => {
  it("renders the city label and ticker copy", () => {
    render(
      <BroadcastBar
        cityLabel="Dublin"
        tickerItems={[
          "Politics",
          "Science",
          "Agriculture",
          "Entertainment",
          "Investments",
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /local area/i })).toBeInTheDocument();
    expect(screen.getByText(/dublin/i, { selector: "p.bb-mini-copy" })).toBeInTheDocument();
    expect(screen.getByText(/politics/i, { selector: "span:not([aria-hidden='true'])" })).toBeInTheDocument();
    expect(screen.getByText(/investments/i, { selector: "span:not([aria-hidden='true'])" })).toBeInTheDocument();
  });
});
