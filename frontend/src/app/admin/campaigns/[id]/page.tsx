import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCampaignAction } from "@/app/admin/actions";
import { CampaignAdminActions } from "@/components/campaign-admin-actions";
import { CampaignForm } from "@/components/campaign-form";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { getCampaign, getDonations } from "@/lib/api";
import { formatAmount, formatDate, formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getCampaign(id);
  return { title: campaign ? `Manage · ${campaign.title}` : "Campaign" };
}

export default async function AdminCampaignPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { created }] = await Promise.all([params, searchParams]);
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const donations = await getDonations(campaign.id);
  const modifiable = campaign.status === "ACTIVE";
  const remaining = (
    Number(campaign.targetAmount) - Number(campaign.collectedAmount)
  ).toFixed(2);

  return (
    <div>
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Dashboard
      </Link>

      {created && (
        <p
          role="status"
          className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"
        >
          Campaign created. It is live on the public campaigns page.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {campaign.title}
        </h1>
        <StatusBadge status={campaign.status} />
      </div>
      <p className="mt-2 text-sm text-zinc-500">
        Created {formatDate(campaign.createdAt)} · Updated{" "}
        {formatDateTime(campaign.updatedAt)} ·{" "}
        <Link
          href={`/campaigns/${campaign.id}`}
          className="underline underline-offset-2 hover:text-zinc-900"
        >
          Public page
        </Link>
      </p>
      <p className="mt-1 font-mono text-xs text-zinc-400">{campaign.id}</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Details</h2>
            {modifiable ? (
              <p className="mt-1 text-sm text-zinc-500">
                Title, description and target can be changed while the campaign
                is active.
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-800">
                This campaign is {campaign.status.toLowerCase()}: completed and
                closed campaigns cannot be modified.
              </p>
            )}
            <div className="mt-5">
              <CampaignForm
                action={updateCampaignAction}
                campaign={campaign}
                submitLabel="Save changes"
                disabled={!modifiable}
              />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-semibold">
              Donations{" "}
              <span className="font-normal text-zinc-500">
                ({donations.length})
              </span>
            </h2>
            {donations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No donations yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Donor</th>
                      <th className="px-4 py-3 font-medium">User id</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {donations.map((donation) => (
                      <tr key={donation.id}>
                        <td className="px-4 py-3 font-medium">
                          {donation.donorName}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                          {donation.userId ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                          {formatDateTime(donation.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                          {formatAmount(donation.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Progress</h2>
            <div className="mt-4">
              <ProgressBar
                collected={campaign.collectedAmount}
                target={campaign.targetAmount}
              />
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Target</dt>
                <dd className="font-semibold">
                  {formatAmount(campaign.targetAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Collected</dt>
                <dd className="font-semibold">
                  {formatAmount(campaign.collectedAmount)}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Remaining</dt>
                <dd className="font-semibold">{formatAmount(remaining)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-6">
            <h2 className="font-semibold">Actions</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Closing stops donations permanently. Deleting is only possible
              while the campaign has no donations.
            </p>
            <div className="mt-4">
              <CampaignAdminActions
                campaign={campaign}
                donationCount={donations.length}
                redirectAfterDelete="/admin"
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
