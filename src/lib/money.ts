/**
 * Monetary helpers following Vision rules:
 * - Naira / Kobo precision
 * - Round half-up to nearest kobo (0.01) at each calculation step
 * - Exact tally: RepaymentAmount × Period = Principal + (Principal × Interest%)
 */

export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function fromKobo(kobo: number): number {
  return kobo / 100;
}

/** Half-up to nearest kobo */
export function roundToKobo(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateInterest(principal: number, interestPercentage: number): number {
  return roundToKobo(principal * (interestPercentage / 100));
}

export function calculateTotalContractual(principal: number, interestPercentage: number): number {
  return roundToKobo(principal + calculateInterest(principal, interestPercentage));
}

/**
 * Exact tally check.
 * Returns true if (repaymentAmount * period) equals principal + interest (within 0.01).
 */
export function isTallyExact(
  principal: number,
  interestPercentage: number,
  repaymentAmount: number,
  period: number
): boolean {
  const expected = calculateTotalContractual(principal, interestPercentage);
  const actual = roundToKobo(repaymentAmount * period);
  return Math.abs(expected - actual) < 0.015;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
}
