import { formatAmount, progressPercent } from "@/lib/format";

export function ProgressBar({
  collected,
  target,
  showAmounts = true,
}: {
  collected: string;
  target: string;
  showAmounts?: boolean;
}) {
  const percent = progressPercent(collected, target);
  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-zinc-200"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        {showAmounts ? (
          <span className="text-zinc-700">
            <span className="font-semibold text-zinc-900">
              {formatAmount(collected)}
            </span>{" "}
            raised of {formatAmount(target)}
          </span>
        ) : (
          <span />
        )}
        <span className="font-medium text-zinc-600">{percent}%</span>
      </div>
    </div>
  );
}
