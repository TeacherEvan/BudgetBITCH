import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/notes/notes-board", () => ({
  NotesBoard: () => <section aria-label="Notes board" role="region" />,
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    notesPage: {
      eyebrow: "Tools",
      title: "Notes",
      description:
        "Quick scratchpad for budget thoughts, reminders, and anything that does not need a category yet.",
    },
  }),
}));

import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the page heading", async () => {
    render(await NotesPage());
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Notes" })).toBeInTheDocument();
  });

  it("renders the notes board", async () => {
    render(await NotesPage());
    expect(screen.getByRole("region", { name: /notes board/i })).toBeInTheDocument();
  });
});
