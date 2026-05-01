import { render, screen } from "@testing-library/react";
import { localeMessages } from "@/i18n/messages";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/notes/notes-board", () => ({
  NotesBoard: () => <section aria-label="Notes board" role="region" />,
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    notesPage: {
      eyebrow: "Tools",
      title: "Notes",
      description: "A quick place for reminders and rough budget thoughts.",
    },
  }),
}));

import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the page heading", async () => {
    render(await NotesPage());
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Notes" })).toBeInTheDocument();
    expect(
      screen.getByText("A quick place for reminders and rough budget thoughts."),
    ).toBeInTheDocument();
  });

  it("renders the notes board", async () => {
    render(await NotesPage());
    expect(screen.getByRole("region", { name: /notes board/i })).toBeInTheDocument();
  });

  it("keeps zh and th notes descriptions aligned with the shorter shell copy", () => {
    expect(localeMessages.zh.notesPage.description).toBe("快速记下提醒和粗略预算想法。");
    expect(localeMessages.th.notesPage.description).toBe(
      "จดเตือนและไอเดียงบประมาณแบบสั้น ๆ",
    );
  });
});
