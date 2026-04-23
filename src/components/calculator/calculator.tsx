"use client";

import { useEffect, useState } from "react";
import { OfflineBanner } from "@/components/pwa/offline-banner";

type CalcOp = "+" | "−" | "×" | "÷" | null;

type CalculatorDraft = {
  display: string;
  stored: number | null;
  op: CalcOp;
  waitingForOperand: boolean;
};

type ButtonConfig = {
  label: string;
  action: () => void;
};

const CALCULATOR_STORAGE_KEY = "bb-calculator-draft";

function getDefaultDraft(): CalculatorDraft {
  return {
    display: "0",
    stored: null,
    op: null,
    waitingForOperand: false,
  };
}

function isCalculatorDraft(value: unknown): value is CalculatorDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const draft = value as Partial<CalculatorDraft>;

  return (
    typeof draft.display === "string" &&
    (typeof draft.stored === "number" || draft.stored === null) &&
    (draft.op === "+" || draft.op === "−" || draft.op === "×" || draft.op === "÷" || draft.op === null) &&
    typeof draft.waitingForOperand === "boolean"
  );
}

function loadDraft(): CalculatorDraft {
  if (typeof window === "undefined") {
    return getDefaultDraft();
  }

  try {
    const raw = window.localStorage.getItem(CALCULATOR_STORAGE_KEY);

    if (!raw) {
      return getDefaultDraft();
    }

    const parsed = JSON.parse(raw);

    return isCalculatorDraft(parsed) ? parsed : getDefaultDraft();
  } catch {
    return getDefaultDraft();
  }
}

function saveDraft(draft: CalculatorDraft) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Keep the calculator usable even if local persistence is unavailable.
  }
}

export function Calculator() {
  const [draft, setDraft] = useState<CalculatorDraft>(() => loadDraft());
  const { display, stored, op, waitingForOperand } = draft;

  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  function handleDigit(digit: string) {
    if (waitingForOperand) {
      setDraft((current) => ({
        ...current,
        display: digit,
        waitingForOperand: false,
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      display: current.display === "0" ? digit : current.display + digit,
    }));
  }

  function handleDecimal() {
    if (waitingForOperand) {
      setDraft((current) => ({
        ...current,
        display: "0.",
        waitingForOperand: false,
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      display: current.display.includes(".") ? current.display : current.display + ".",
    }));
  }

  function compute(a: number, b: number, operator: CalcOp): number {
    switch (operator) {
      case "+":
        return a + b;
      case "−":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  }

  function handleOperator(nextOp: CalcOp) {
    const current = parseFloat(display);

    if (stored !== null && op && !waitingForOperand) {
      const result = compute(stored, current, op);
      setDraft((currentDraft) => ({
        ...currentDraft,
        display: String(result),
        stored: result,
        op: nextOp,
        waitingForOperand: true,
      }));
    } else {
      setDraft((currentDraft) => ({
        ...currentDraft,
        stored: current,
        op: nextOp,
        waitingForOperand: true,
      }));
      return;
    }
  }

  function handleEquals() {
    const current = parseFloat(display);
    if (stored !== null && op) {
      const result = compute(stored, current, op);
      setDraft({
        display: String(result),
        stored: null,
        op: null,
        waitingForOperand: true,
      });
    }
  }

  function handleClear() {
    setDraft(getDefaultDraft());
  }

  const buttons: ButtonConfig[] = [
    { label: "7", action: () => handleDigit("7") },
    { label: "8", action: () => handleDigit("8") },
    { label: "9", action: () => handleDigit("9") },
    { label: "÷", action: () => handleOperator("÷") },
    { label: "4", action: () => handleDigit("4") },
    { label: "5", action: () => handleDigit("5") },
    { label: "6", action: () => handleDigit("6") },
    { label: "×", action: () => handleOperator("×") },
    { label: "1", action: () => handleDigit("1") },
    { label: "2", action: () => handleDigit("2") },
    { label: "3", action: () => handleDigit("3") },
    { label: "+", action: () => handleOperator("+") },
    { label: "0", action: () => handleDigit("0") },
    { label: ".", action: handleDecimal },
    { label: "=", action: handleEquals },
  ];

  return (
    <section
      className="bb-panel bb-panel-strong mx-auto max-w-xs p-5"
      aria-label="Calculator"
    >
      <OfflineBanner className="mb-4" />
      <p
        role="status"
        className="mb-4 rounded bg-black/40 px-4 py-3 text-right font-mono text-3xl text-white"
      >
        {display}
      </p>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="bb-button-secondary col-span-2 text-sm font-semibold"
          aria-label="C"
        >
          C
        </button>
        <button
          type="button"
          onClick={() => handleOperator("÷")}
          className="bb-button-secondary text-sm font-semibold"
          aria-label="÷"
        >
          ÷
        </button>
        <button
          type="button"
          onClick={() => handleOperator("×")}
          className="bb-button-secondary text-sm font-semibold"
          aria-label="×"
        >
          ×
        </button>

        {buttons.slice(0, 3).map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.action}
            className="bb-button-ghost text-sm"
            aria-label={button.label}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOperator("−")}
          className="bb-button-secondary text-sm font-semibold"
          aria-label="−"
        >
          −
        </button>

        {buttons.slice(4, 7).map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.action}
            className="bb-button-ghost text-sm"
            aria-label={button.label}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleOperator("+")}
          className="bb-button-secondary text-sm font-semibold"
          aria-label="+"
        >
          +
        </button>

        {buttons.slice(8, 11).map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={button.action}
            className="bb-button-ghost text-sm"
            aria-label={button.label}
          >
            {button.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleEquals}
          className="bb-button-primary row-span-2 text-sm font-semibold"
          aria-label="="
        >
          =
        </button>

        <button
          type="button"
          onClick={() => handleDigit("0")}
          className="bb-button-ghost col-span-2 text-sm"
          aria-label="0"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDecimal}
          className="bb-button-ghost text-sm"
          aria-label="."
        >
          .
        </button>
      </div>
    </section>
  );
}
