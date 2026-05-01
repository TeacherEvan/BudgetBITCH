import { fireEvent, render, screen } from "@testing-library/react";
import { localeMessages } from "@/i18n/messages";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesBoard } from "./notes-board";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      regionLabel: "Notes board",
      inputLabel: "New note",
      inputPlaceholder: "Type a note and press Enter or Add note…",
      addNote: "Add note",
      emptyState: "No notes yet. Add one above.",
      deleteNote: `Delete ${values?.text ?? ""}`.trim(),
    };

    return translations[key] ?? key;
  },
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  localStorageMock.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotesBoard", () => {
  it("shows an empty state message when no notes exist", () => {
    render(<NotesBoard />);

    expect(
      screen.getByText(/notes, calculator, and launch settings stay available on this device/i),
    ).toBeInTheDocument();
    expect(screen.getByText("No notes yet. Add one above.")).toBeInTheDocument();
  });

  it("adds a note when the user types and clicks Add note", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Buy groceries" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("clears the input after adding a note", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Test entry" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(input).toHaveValue("");
  });

  it("removes a note when Delete is clicked", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Temporary note" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete temporary note/i }));
    expect(screen.queryByText("Temporary note")).not.toBeInTheDocument();
  });

  it("does not add an empty note", () => {
    render(<NotesBoard />);
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });

  it("falls back to the empty state when stored notes are not a valid note array", () => {
    window.localStorage.setItem("bb-notes", JSON.stringify({ nope: true }));

    render(<NotesBoard />);

    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });

  it("keeps zh and th empty states aligned with the shorter copy", () => {
    expect(localeMessages.zh.notesBoard.emptyState).toBe("还没有笔记。先在上方添加一条。");
    expect(localeMessages.th.notesBoard.emptyState).toBe("ยังไม่มีโน้ต เพิ่มด้านบนได้เลย");
  });
});
