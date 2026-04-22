# Calculator, Notes, and Home Nav Implementation Plan

> **For agentic workers:** REQUIRED: Use the `subagent-driven-development` agent (recommended) or `executing-plans` agent to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Calculator page, a Notes page, and a persistent top nav bar to every `(app)` route so the user can always get back to the Dashboard.

**Architecture:** A new `src/app/(app)/layout.tsx` wraps all `(app)` routes with a thin `AppNav` component containing a Dashboard link. Calculator is a pure client-side component (arithmetic, no persistence needed). Notes is a client-side component that persists to `localStorage`. Both new routes are registered in `buildLauncherTools()` so they appear on the dashboard's LauncherGrid.

**Tech Stack:** Next.js 14 App Router, React 18 (useState/useEffect), Tailwind via `bb-*` CSS utilities, Vitest + Testing Library (unit), Playwright (E2E), Lucide icons.

---

## File Map

| Action  | Path |
|---------|------|
| Create  | `src/app/(app)/layout.tsx` |
| Create  | `src/app/(app)/layout.test.tsx` |
| Create  | `src/components/dashboard/app-nav.tsx` |
| Create  | `src/components/dashboard/app-nav.test.tsx` |
| Create  | `src/app/(app)/calculator/page.tsx` |
| Create  | `src/app/(app)/calculator/page.test.tsx` |
| Create  | `src/components/calculator/calculator.tsx` |
| Create  | `src/components/calculator/calculator.test.tsx` |
| Create  | `src/app/(app)/notes/page.tsx` |
| Create  | `src/app/(app)/notes/page.test.tsx` |
| Create  | `src/components/notes/notes-board.tsx` |
| Create  | `src/components/notes/notes-board.test.tsx` |
| Create  | `tests/e2e/calculator.spec.ts` |
| Create  | `tests/e2e/notes.spec.ts` |
| Modify  | `src/modules/dashboard/dashboard-data.ts` |
| Modify  | `src/components/dashboard/launcher-grid.test.tsx` |
| Modify  | `src/app/(app)/dashboard/page.test.tsx` |

---

## Task 1: AppNav component

**Files:**
- Create: `src/components/dashboard/app-nav.tsx`
- Create: `src/components/dashboard/app-nav.test.tsx`

- [x] **Step 1.1: Write the failing test**

```tsx
// src/components/dashboard/app-nav.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppNav } from "./app-nav";

describe("AppNav", () => {
  it("renders a link that goes to the dashboard", () => {
    render(<AppNav />);
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("has a nav landmark", () => {
    render(<AppNav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
```

- [x] **Step 1.2: Run test to verify it fails**

```bash
npx vitest run src/components/dashboard/app-nav.test.tsx
```
Expected: FAIL – `Cannot find module './app-nav'`

- [x] **Step 1.3: Implement AppNav**

```tsx
// src/components/dashboard/app-nav.tsx
import Link from "next/link";
import { Home } from "lucide-react";

export function AppNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center border-b border-white/10 bg-[rgba(8,21,18,0.92)] px-4 py-2 backdrop-blur"
      aria-label="App navigation"
    >
      <Link
        href="/dashboard"
        className="bb-button-ghost flex items-center gap-2 px-3 py-1.5 text-sm font-semibold"
        aria-label="Go to dashboard"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>
    </nav>
  );
}
```

- [x] **Step 1.4: Run test to verify it passes**

```bash
npx vitest run src/components/dashboard/app-nav.test.tsx
```
Expected: PASS (2 tests)

- [x] **Step 1.5: Commit**

```bash
git add src/components/dashboard/app-nav.tsx src/components/dashboard/app-nav.test.tsx
git commit -m "feat: add AppNav component with dashboard home link"
```

---

## Task 2: (app) shared layout

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/layout.test.tsx`

- [x] **Step 2.1: Write the failing test**

```tsx
// src/app/(app)/layout.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppLayout from "./layout";

describe("AppLayout", () => {
  it("renders children inside a nav-wrapped shell", () => {
    render(<AppLayout><p>page content</p></AppLayout>);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the dashboard home link", () => {
    render(<AppLayout><span /></AppLayout>);
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
```

- [x] **Step 2.2: Run test to verify it fails**

```bash
npx vitest run "src/app/\(app\)/layout.test.tsx"
```
Expected: FAIL – file not found or missing export

- [x] **Step 2.3: Implement the layout**

```tsx
// src/app/(app)/layout.tsx
import { AppNav } from "@/components/dashboard/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
```

- [x] **Step 2.4: Run test to verify it passes**

```bash
npx vitest run "src/app/\(app\)/layout.test.tsx"
```
Expected: PASS (2 tests)

- [x] **Step 2.5: Commit**

```bash
git add "src/app/(app)/layout.tsx" "src/app/(app)/layout.test.tsx"
git commit -m "feat: add shared (app) layout with AppNav"
```

---

## Task 3: Calculator core component

**Files:**
- Create: `src/components/calculator/calculator.tsx`
- Create: `src/components/calculator/calculator.test.tsx`

- [x] **Step 3.1: Write the failing tests**

```tsx
// src/components/calculator/calculator.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Calculator } from "./calculator";

describe("Calculator", () => {
  it("renders the display with initial value 0", () => {
    render(<Calculator />);
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("appends digit on button press", async () => {
    render(<Calculator />);
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    expect(screen.getByRole("status")).toHaveTextContent("4");
  });

  it("computes 3 + 5 = 8", async () => {
    render(<Calculator />);
    await userEvent.click(screen.getByRole("button", { name: "3" }));
    await userEvent.click(screen.getByRole("button", { name: "+" }));
    await userEvent.click(screen.getByRole("button", { name: "5" }));
    await userEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getByRole("status")).toHaveTextContent("8");
  });

  it("computes 9 - 4 = 5", async () => {
    render(<Calculator />);
    await userEvent.click(screen.getByRole("button", { name: "9" }));
    await userEvent.click(screen.getByRole("button", { name: "−" }));
    await userEvent.click(screen.getByRole("button", { name: "4" }));
    await userEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getByRole("status")).toHaveTextContent("5");
  });

  it("C button resets display to 0", async () => {
    render(<Calculator />);
    await userEvent.click(screen.getByRole("button", { name: "7" }));
    await userEvent.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("handles decimal input", async () => {
    render(<Calculator />);
    await userEvent.click(screen.getByRole("button", { name: "1" }));
    await userEvent.click(screen.getByRole("button", { name: "." }));
    await userEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.getByRole("status")).toHaveTextContent("1.5");
  });
});
```

- [x] **Step 3.2: Run to verify they fail**

```bash
npx vitest run src/components/calculator/calculator.test.tsx
```
Expected: FAIL – module not found

- [x] **Step 3.3: Implement the Calculator component**

```tsx
// src/components/calculator/calculator.tsx
"use client";

import { useState } from "react";

type CalcOp = "+" | "−" | "×" | "÷" | null;

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  function handleDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  }

  function handleDecimal() {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  }

  function handleOperator(nextOp: CalcOp) {
    const current = parseFloat(display);
    if (stored !== null && op && !waitingForOperand) {
      const result = compute(stored, current, op);
      setDisplay(String(result));
      setStored(result);
    } else {
      setStored(current);
    }
    setOp(nextOp);
    setWaitingForOperand(true);
  }

  function handleEquals() {
    const current = parseFloat(display);
    if (stored !== null && op) {
      const result = compute(stored, current, op);
      setDisplay(String(result));
      setStored(null);
      setOp(null);
      setWaitingForOperand(true);
    }
  }

  function handleClear() {
    setDisplay("0");
    setStored(null);
    setOp(null);
    setWaitingForOperand(false);
  }

  function compute(a: number, b: number, operator: CalcOp): number {
    switch (operator) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  }

  const digits = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."];

  return (
    <section
      className="bb-panel bb-panel-strong mx-auto max-w-xs p-5"
      aria-label="Calculator"
    >
      <p role="status" className="mb-4 rounded bg-black/40 px-4 py-3 text-right font-mono text-3xl text-white">
        {display}
      </p>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={handleClear}
          className="bb-button-secondary col-span-2 text-sm font-semibold"
          aria-label="C"
        >
          C
        </button>
        {(["÷", "×"] as CalcOp[]).map((o) => (
          <button
            key={o!}
            onClick={() => handleOperator(o)}
            className="bb-button-secondary text-sm font-semibold"
            aria-label={o!}
          >
            {o}
          </button>
        ))}

        {["7", "8", "9"].map((d) => (
          <button key={d} onClick={() => handleDigit(d)} className="bb-button-ghost text-sm" aria-label={d}>{d}</button>
        ))}
        <button onClick={() => handleOperator("−")} className="bb-button-secondary text-sm font-semibold" aria-label="−">−</button>

        {["4", "5", "6"].map((d) => (
          <button key={d} onClick={() => handleDigit(d)} className="bb-button-ghost text-sm" aria-label={d}>{d}</button>
        ))}
        <button onClick={() => handleOperator("+")} className="bb-button-secondary text-sm font-semibold" aria-label="+">+</button>

        {["1", "2", "3"].map((d) => (
          <button key={d} onClick={() => handleDigit(d)} className="bb-button-ghost text-sm" aria-label={d}>{d}</button>
        ))}
        <button
          onClick={handleEquals}
          className="bb-button-primary row-span-2 text-sm font-semibold"
          aria-label="="
        >=</button>

        <button onClick={() => handleDigit("0")} className="bb-button-ghost col-span-2 text-sm" aria-label="0">0</button>
        <button onClick={handleDecimal} className="bb-button-ghost text-sm" aria-label=".">.</button>
      </div>
    </section>
  );
}
```

- [x] **Step 3.4: Run tests to verify they pass**

```bash
npx vitest run src/components/calculator/calculator.test.tsx
```
Expected: PASS (6 tests)

- [x] **Step 3.5: Commit**

```bash
git add src/components/calculator/calculator.tsx src/components/calculator/calculator.test.tsx
git commit -m "feat: add Calculator component with arithmetic operations"
```

---

## Task 4: Calculator page

**Files:**
- Create: `src/app/(app)/calculator/page.tsx`
- Create: `src/app/(app)/calculator/page.test.tsx`

- [x] **Step 4.1: Write the failing test**

```tsx
// src/app/(app)/calculator/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalculatorPage from "./page";

describe("CalculatorPage", () => {
  it("renders the page heading", () => {
    render(<CalculatorPage />);
    expect(screen.getByRole("heading", { name: /calculator/i })).toBeInTheDocument();
  });

  it("renders the calculator widget", () => {
    render(<CalculatorPage />);
    expect(screen.getByRole("region", { name: /calculator/i })).toBeInTheDocument();
  });
});
```

- [x] **Step 4.2: Run to verify it fails**

```bash
npx vitest run "src/app/\(app\)/calculator/page.test.tsx"
```
Expected: FAIL – module not found

- [x] **Step 4.3: Implement the page**

```tsx
// src/app/(app)/calculator/page.tsx
import { Calculator } from "@/components/calculator/calculator";

export default function CalculatorPage() {
  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">Tools</p>
        <h1 className="mt-3 text-4xl font-semibold">Calculator</h1>
        <p className="bb-copy mt-3 max-w-xl text-sm">
          Quick arithmetic for budget checks — no number crunching in your head.
        </p>
        <div className="mt-8">
          <Calculator />
        </div>
      </section>
    </main>
  );
}
```

> Note: The `<Calculator />` renders a `<section aria-label="Calculator">` which satisfies `getByRole("region", { name: /calculator/i })` since section with an accessible name is mapped to the `region` role.

- [x] **Step 4.4: Run tests to verify they pass**

```bash
npx vitest run "src/app/\(app\)/calculator/page.test.tsx"
```
Expected: PASS (2 tests)

- [x] **Step 4.5: Commit**

```bash
git add "src/app/(app)/calculator/page.tsx" "src/app/(app)/calculator/page.test.tsx"
git commit -m "feat: add /calculator page"
```

---

## Task 5: Notes core component

**Files:**
- Create: `src/components/notes/notes-board.tsx`
- Create: `src/components/notes/notes-board.test.tsx`

- [x] **Step 5.1: Write the failing tests**

```tsx
// src/components/notes/notes-board.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesBoard } from "./notes-board";

// localStorage is not available in jsdom by default — mock it.
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

beforeEach(() => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock, writable: true });
  localStorageMock.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotesBoard", () => {
  it("shows an empty state message when no notes exist", () => {
    render(<NotesBoard />);
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });

  it("adds a note when the user types and clicks Add note", async () => {
    render(<NotesBoard />);
    await userEvent.type(screen.getByRole("textbox", { name: /new note/i }), "Buy groceries");
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("clears the input after adding a note", async () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    await userEvent.type(input, "Test entry");
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(input).toHaveValue("");
  });

  it("removes a note when Delete is clicked", async () => {
    render(<NotesBoard />);
    await userEvent.type(screen.getByRole("textbox", { name: /new note/i }), "Temporary note");
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    await userEvent.click(screen.getByRole("button", { name: /delete temporary note/i }));
    expect(screen.queryByText("Temporary note")).not.toBeInTheDocument();
  });

  it("does not add an empty note", async () => {
    render(<NotesBoard />);
    await userEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });
});
```

- [x] **Step 5.2: Run to verify they fail**

```bash
npx vitest run src/components/notes/notes-board.test.tsx
```
Expected: FAIL – module not found

- [x] **Step 5.3: Implement NotesBoard**

```tsx
// src/components/notes/notes-board.tsx
"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type Note = {
  id: string;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = "bb-notes";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotesBoard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;
    const next: Note[] = [
      { id: crypto.randomUUID(), text: trimmed, createdAt: new Date().toISOString() },
      ...notes,
    ];
    setNotes(next);
    saveNotes(next);
    setInput("");
  }

  function handleDelete(id: string) {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    saveNotes(next);
  }

  return (
    <section className="bb-panel bb-panel-strong mx-auto max-w-2xl p-5" aria-label="Notes board">
      <div className="flex gap-2">
        <label htmlFor="new-note-input" className="sr-only">
          New note
        </label>
        <input
          id="new-note-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Type a note and press Enter or Add note…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="New note"
        />
        <button
          onClick={handleAdd}
          className="bb-button-primary px-4 py-2 text-sm"
          aria-label="Add note"
        >
          Add note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="bb-mini-copy mt-6 text-center text-sm">No notes yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 grid gap-2" aria-label="Notes list">
          {notes.map((note) => (
            <li
              key={note.id}
              className="bb-compact-card flex items-start justify-between gap-3 p-3"
            >
              <span className="text-sm text-white">{note.text}</span>
              <button
                onClick={() => handleDelete(note.id)}
                className="shrink-0 rounded p-1 text-white/40 transition-colors hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Delete ${note.text}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [x] **Step 5.4: Run tests to verify they pass**

```bash
npx vitest run src/components/notes/notes-board.test.tsx
```
Expected: PASS (5 tests)

- [x] **Step 5.5: Commit**

```bash
git add src/components/notes/notes-board.tsx src/components/notes/notes-board.test.tsx
git commit -m "feat: add NotesBoard component with localStorage persistence"
```

---

## Task 6: Notes page

**Files:**
- Create: `src/app/(app)/notes/page.tsx`
- Create: `src/app/(app)/notes/page.test.tsx`

- [x] **Step 6.1: Write the failing test**

```tsx
// src/app/(app)/notes/page.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the page heading", () => {
    render(<NotesPage />);
    expect(screen.getByRole("heading", { name: /notes/i })).toBeInTheDocument();
  });

  it("renders the notes board", () => {
    render(<NotesPage />);
    expect(screen.getByRole("region", { name: /notes board/i })).toBeInTheDocument();
  });
});
```

- [x] **Step 6.2: Run to verify it fails**

```bash
npx vitest run "src/app/\(app\)/notes/page.test.tsx"
```
Expected: FAIL – module not found

- [x] **Step 6.3: Implement the page**

```tsx
// src/app/(app)/notes/page.tsx
import { NotesBoard } from "@/components/notes/notes-board";

export default function NotesPage() {
  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">Tools</p>
        <h1 className="mt-3 text-4xl font-semibold">Notes</h1>
        <p className="bb-copy mt-3 max-w-xl text-sm">
          Quick scratchpad for budget thoughts, reminders, and anything that doesn't need a category yet.
        </p>
        <div className="mt-8">
          <NotesBoard />
        </div>
      </section>
    </main>
  );
}
```

- [x] **Step 6.4: Run tests to verify they pass**

```bash
npx vitest run "src/app/\(app\)/notes/page.test.tsx"
```
Expected: PASS (2 tests)

- [x] **Step 6.5: Commit**

```bash
git add "src/app/(app)/notes/page.tsx" "src/app/(app)/notes/page.test.tsx"
git commit -m "feat: add /notes page"
```

---

## Task 7: Register calculator and notes in the LauncherGrid

**Files:**
- Modify: `src/modules/dashboard/dashboard-data.ts`
- Modify: `src/components/dashboard/launcher-grid.test.tsx`
- Modify: `src/app/(app)/dashboard/page.test.tsx`

- [x] **Step 7.1: Update `buildLauncherTools()` in dashboard-data.ts**

Open `src/modules/dashboard/dashboard-data.ts` and find the `buildLauncherTools` function (line ~168). Add two entries at the end of the array, before the closing `]`:

```ts
// src/modules/dashboard/dashboard-data.ts  (inside buildLauncherTools return array)
    {
      title: "Open calculator",
      href: "/calculator",
      detail: "Quick arithmetic without leaving the board.",
      label: "Calculator",
    },
    {
      title: "Open notes",
      href: "/notes",
      detail: "Scratchpad for budget thoughts and reminders.",
      label: "Notes",
    },
```

The updated `buildLauncherTools()` should return 8 tools total.

- [x] **Step 7.2: Update launcher-grid.test.tsx — fix link count**

In `src/components/dashboard/launcher-grid.test.tsx`, find the `toHaveLength(6)` assertion and change it to `toHaveLength(8)`. Also add the two new tools to the `tools` prop passed to `<LauncherGrid>`:

```tsx
// Add after the "Open cashflow" entry in the tools array:
          {
            title: "Open calculator",
            href: "/calculator",
            detail: "Quick arithmetic without leaving the board.",
            label: "Calculator",
          },
          {
            title: "Open notes",
            href: "/notes",
            detail: "Scratchpad for budget thoughts and reminders.",
            label: "Notes",
          },
```

And change:
```tsx
    expect(screen.getAllByRole("link")).toHaveLength(6);
```
to:
```tsx
    expect(screen.getAllByRole("link")).toHaveLength(8);
```

- [x] **Step 7.3: Update dashboard/page.test.tsx — add new tools to mock**

In `src/app/(app)/dashboard/page.test.tsx`, find the `launcherTools` array in the mock (currently 6 entries) and add the same two new entries after the "Open cashflow" entry:

```tsx
// Add to launcherTools array in the mock:
        {
          title: "Open calculator",
          href: "/calculator",
          detail: "Quick arithmetic without leaving the board.",
          label: "Calculator",
        },
        {
          title: "Open notes",
          href: "/notes",
          detail: "Scratchpad for budget thoughts and reminders.",
          label: "Notes",
        },
```

- [x] **Step 7.4: Run affected tests to verify they pass**

```bash
npx vitest run src/modules/dashboard src/components/dashboard/launcher-grid.test.tsx "src/app/\(app\)/dashboard/page.test.tsx"
```
Expected: all PASS

- [x] **Step 7.5: Commit**

```bash
git add src/modules/dashboard/dashboard-data.ts \
        src/components/dashboard/launcher-grid.test.tsx \
        "src/app/(app)/dashboard/page.test.tsx"
git commit -m "feat: register calculator and notes in LauncherGrid"
```

---

## Task 8: Playwright E2E — calculator

**Files:**
- Create: `tests/e2e/calculator.spec.ts`

- [x] **Step 8.1: Write the spec**

```ts
// tests/e2e/calculator.spec.ts
import { expect, test } from "@playwright/test";

test("calculator page renders and performs basic arithmetic", async ({ page }) => {
  await page.goto("/calculator");

  await expect(page.getByRole("heading", { name: /calculator/i })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("0");

  await page.getByRole("button", { name: "3" }).click();
  await page.getByRole("button", { name: "+" }).click();
  await page.getByRole("button", { name: "5" }).click();
  await page.getByRole("button", { name: "=" }).click();

  await expect(page.getByRole("status")).toHaveText("8");
});

test("calculator page has a working home nav link", async ({ page }) => {
  await page.goto("/calculator");
  await expect(page.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
```

- [ ] **Step 8.2: Run the spec (requires dev server running)**

Start dev server first if not running: `npm run dev &`
Then:
```bash
npx playwright test tests/e2e/calculator.spec.ts
```
Expected: PASS (2 tests)

- [ ] **Step 8.3: Commit**

```bash
git add tests/e2e/calculator.spec.ts
git commit -m "test(e2e): add calculator Playwright spec"
```

---

## Task 9: Playwright E2E — notes

**Files:**
- Create: `tests/e2e/notes.spec.ts`

- [x] **Step 9.1: Write the spec**

```ts
// tests/e2e/notes.spec.ts
import { expect, test } from "@playwright/test";

test("notes page renders empty state on first visit", async ({ page }) => {
  await page.goto("/notes");
  await expect(page.getByRole("heading", { name: /notes/i })).toBeVisible();
  await expect(page.getByText(/no notes yet/i)).toBeVisible();
});

test("notes page — add and delete a note", async ({ page }) => {
  await page.goto("/notes");

  await page.getByRole("textbox", { name: /new note/i }).fill("Buy oat milk");
  await page.getByRole("button", { name: /add note/i }).click();

  await expect(page.getByText("Buy oat milk")).toBeVisible();

  await page.getByRole("button", { name: /delete buy oat milk/i }).click();

  await expect(page.getByText("Buy oat milk")).not.toBeVisible();
  await expect(page.getByText(/no notes yet/i)).toBeVisible();
});

test("notes page has a working home nav link", async ({ page }) => {
  await page.goto("/notes");
  await expect(page.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
```

- [ ] **Step 9.2: Run the spec**

```bash
npx playwright test tests/e2e/notes.spec.ts
```
Expected: PASS (3 tests)

- [ ] **Step 9.3: Commit**

```bash
git add tests/e2e/notes.spec.ts
git commit -m "test(e2e): add notes Playwright spec"
```

---

## Task 10: Full validation pass

- [x] **Step 10.1: Run all unit tests**

```bash
npm test
```
Expected: all pass, no regressions

- [x] **Step 10.2: Run lint**

```bash
npm run lint
```
Expected: no errors

- [x] **Step 10.3: Run build**

```bash
npm run build
```
Expected: successful build with no type errors

- [ ] **Step 10.4: Run E2E suite**

```bash
npm run test:e2e
```
Expected: all pass including new specs

- [ ] **Step 10.5: Final commit**

```bash
git commit --allow-empty -m "chore: full validation pass — calculator, notes, home nav complete"
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Calculator feature — Tasks 3 + 4 + 8
- ✅ Notes feature — Tasks 5 + 6 + 9
- ✅ Home nav ("takes you to dashboard") — Tasks 1 + 2
- ✅ LauncherGrid surface updated — Task 7
- ✅ All tests updated — Tasks 7.2, 7.3, 8, 9

**Type consistency check:**
- `CalcOp` type used consistently in `Calculator` throughout Task 3
- `Note` type used consistently in `NotesBoard` throughout Task 5
- `AppNav` default export matches import in `AppLayout` — ✅
- `buildLauncherTools()` returns `DashboardLauncherTool[]` — new entries match the existing `{ title, href, detail, label }` shape — ✅

**Placeholder scan:** No TBDs, TODOs, or "similar to Task N" shortcuts found.
