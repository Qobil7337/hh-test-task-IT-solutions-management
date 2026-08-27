import type { Metadata } from "next";
import Link from "next/link";
import { CampaignAdminActions } from "@/components/campaign-admin-actions";
import { StatusBadge } from "@/components/status-badge";
import { SystemHealth } from "@/components/system-health";
import { getCampaigns } from "@/lib/api";
import {
  formatAmount,
  formatDate,
  progressPercent,
  sumAmounts,
} from "@/lib/format";
import type { CampaignStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const campaigns = await getCampaigns();
  const countByStatus = (status: CampaignStatus) =>
    campaigns.filter((campaign) => campaign.status === status).length;
  const totalRaised = sumAmounts(
    campaigns.map((campaign) => campaign.collectedAmount),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-zinc-600">
            Every campaign and the system status, live from the API.
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + New campaign
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Campaigns" value={String(campaigns.length)} />
        <Stat label="Active" value={String(countByStatus("ACTIVE"))} />
        <Stat label="Completed" value={String(countByStatus("COMPLETED"))} />
        <Stat label="Closed" value={String(countByStatus("CLOSED"))} />
        <Stat label="Total raised" value={formatAmount(totalRaised)} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="font-semibold">All campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              No campaigns yet.{" "}
              <Link
                href="/admin/campaigns/new"
                className="underline underline-offset-4"
              >
                Create the first one
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="align-top">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/campaigns/${campaign.id}`}
                          className="font-medium hover:underline"
                        >
                          {campaign.title}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-zinc-500">
                          {campaign.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium">
                          {formatAmount(campaign.collectedAmount)}{" "}
                          <span className="font-normal text-zinc-500">
                            / {formatAmount(campaign.targetAmount)}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {progressPercent(
                            campaign.collectedAmount,
                            campaign.targetAmount,
                          )}
                          %
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-start justify-end gap-2">
                          <Link
                            href={`/admin/campaigns/${campaign.id}`}
                            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            Edit
                          </Link>
                          <CampaignAdminActions campaign={campaign} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <SystemHealth />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
