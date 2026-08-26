import type { CampaignStatus } from "@/lib/types";

const STYLES: Record<CampaignStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  COMPLETED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  CLOSED: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
};

const LABELS: Record<CampaignStatus, string> = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
