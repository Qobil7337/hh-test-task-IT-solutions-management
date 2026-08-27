const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Display formatting only — money arithmetic happens in the backend. */
export function formatAmount(value: string): string {
  return `$${amountFormatter.format(Number(value))}`;
}

/**
 * Sums decimal strings in integer cents (exact for the DECIMAL(12,2) values
 * the API returns). Display only — totals are never sent back to the API.
 */
export function sumAmounts(values: string[]): string {
  const cents = values.reduce(
    (total, value) => total + Math.round(Number(value) * 100),
    0,
  );
  return (cents / 100).toFixed(2);
}

export function progressPercent(collected: string, target: string): number {
  const targetNumber = Number(target);
  if (!targetNumber) return 0;
  return Math.min(100, Math.round((Number(collected) / targetNumber) * 100));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
