// convex/lib/receipt/ledgerMath.ts
// Production-ready IAS 21 FX conversion, Banker's Rounding, and Zero-Bias Hare-Niemeyer Split

export type MinorUnits = number & { readonly __brand: "MinorUnits" };
export type FxMicros = number & { readonly __brand: "FxMicros" }; // 1_000_000 = 1.000000

/**
 * Exact string-to-minor-units parser. Avoids IEEE-754 float multiplication (e.g. 19.99 * 100 = 1998.9999999999998).
 */
export function parseToMinorUnits(rawAmount: string, decimals = 2): MinorUnits {
  const cleaned = rawAmount.replace(/[,\s฿R$€£]/g, "").trim();
  const match = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(cleaned);
  if (!match) throw new Error(`Invalid monetary string: "${rawAmount}"`);

  const sign = match[1] === "-" ? -1 : 1;
  const whole = BigInt(match[2]);
  const fracRaw = (match[3] ?? "").padEnd(decimals + 1, "0");
  const fracMain = BigInt(fracRaw.slice(0, decimals) || "0");
  const nextDigit = Number(fracRaw[decimals] ?? "0");
  const trailingRest = fracRaw.slice(decimals + 1);

  const scale = BigInt(10 ** decimals);
  let total = whole * scale + fracMain;

  // IEEE 754-2008 Round Half to Even (Banker's Rounding)
  const five = BigInt(5);
  if (nextDigit > 5 || (nextDigit === 5 && /[1-9]/.test(trailingRest))) {
    total += BigInt(1);
  } else if (nextDigit === 5 && total % BigInt(2) !== BigInt(0)) {
    total += BigInt(1);
  }

  return (Number(total) * sign) as MinorUnits;
}

/**
 * IAS 21 Functional Currency Converter using BigInt Banker's Rounding.
 */
export function convertToFunctionalMinor(
  originalMinor: MinorUnits,
  fxRateMicros: FxMicros
): MinorUnits {
  const num = BigInt(originalMinor) * BigInt(fxRateMicros);
  const den = BigInt(1000000);
  const quotient = num / den;
  const remainder = num % den;
  const absRem = remainder < BigInt(0) ? -remainder : remainder;
  const half = BigInt(500000);

  let rounded = quotient;
  const sign = num < BigInt(0) ? BigInt(-1) : BigInt(1);
  if (absRem > half || (absRem === half && quotient % BigInt(2) !== BigInt(0))) {
    rounded += sign;
  }
  return Number(rounded) as MinorUnits;
}

/**
 * Zero-Bias Largest Remainder Split (Hare-Niemeyer) with FNV-1a deterministic tie-breaking
 * so Partner A doesn't pay every odd cent/satang on 50/50 shared board splits.
 */
function fnv1aHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface SplitParticipant {
  memberId: string;
  weight: number;
}

export function splitExpenseFairly(
  totalMinor: MinorUnits,
  participants: ReadonlyArray<SplitParticipant>,
  transactionSeedId: string
): Record<string, MinorUnits> {
  const totalWeight = participants.reduce((acc, p) => acc + p.weight, 0);
  if (totalWeight <= 0) throw new Error("Total split weight must be > 0");

  const sign = totalMinor < 0 ? -1 : 1;
  const absTotal = Math.abs(totalMinor);

  const allocations = participants.map((p) => {
    const exact = (absTotal * p.weight) / totalWeight;
    const floored = Math.floor(exact);
    return {
      memberId: p.memberId,
      floored,
      remainder: exact - floored,
      tieBreaker: fnv1aHash(`${transactionSeedId}:${p.memberId}`),
    };
  });

  let leftover = absTotal - allocations.reduce((sum, a) => sum + a.floored, 0);

  allocations.sort((a, b) => {
    if (Math.abs(b.remainder - a.remainder) > 1e-9) {
      return b.remainder - a.remainder;
    }
    return a.tieBreaker - b.tieBreaker;
  });

  for (let i = 0; i < leftover; i++) {
    allocations[i].floored += 1;
  }

  return Object.fromEntries(
    allocations.map((a) => [a.memberId, (a.floored * sign) as MinorUnits])
  );
}