const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Display formatting only — money arithmetic happens in the backend. */
export function formatAmount(value: string): string {
  return `$${amountFormatter.format(Number(value))}`;
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
