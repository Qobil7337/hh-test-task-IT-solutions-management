import Link from "next/link";
import { formatAmount } from "@/lib/format";
import type { Campaign } from "@/lib/types";
import { CampaignImage } from "./campaign-image";
import { ProgressBar } from "./progress-bar";
import { StatusBadge } from "./status-badge";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <CampaignImage
        id={campaign.id}
        title={campaign.title}
        className="aspect-video"
      />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold leading-snug group-hover:underline">
            {campaign.title}
          </h2>
          <StatusBadge status={campaign.status} />
        </div>
        <p className="line-clamp-2 text-sm text-zinc-600">
          {campaign.description}
        </p>
        <dl className="mt-auto grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-zinc-500">Target</dt>
            <dd className="font-medium">{formatAmount(campaign.targetAmount)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Collected</dt>
            <dd className="font-medium">
              {formatAmount(campaign.collectedAmount)}
            </dd>
          </div>
        </dl>
        <ProgressBar
          collected={campaign.collectedAmount}
          target={campaign.targetAmount}
          showAmounts={false}
        />
      </div>
    </Link>
  );
}
