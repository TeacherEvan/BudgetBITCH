"use client";

import { useState } from "react";

type CalcOp = "+" | "−" | "×" | "÷" | null;

type ButtonConfig = {
  label: string;
  action: () => void;
};

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<CalcOp>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  function handleDigit(digit: string) {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }

    setDisplay((current) => (current === "0" ? digit : current + digit));
  }

  function handleDecimal() {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }

    setDisplay((current) => (current.includes(".") ? current : current + "."));
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
