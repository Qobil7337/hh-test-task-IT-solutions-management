import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { RoleBadge } from "@/components/role-badge";
import { getCampaigns, getMyDonations } from "@/lib/api";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  sumAmounts,
} from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My account" };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { token, user } = await requireUser("/account");
  const [donations, campaigns] = await Promise.all([
    getMyDonations(token),
    getCampaigns(),
  ]);
  const campaignTitles = new Map(
    campaigns.map((campaign) => [campaign.id, campaign.title]),
  );
  const total = sumAmounts(donations.map((donation) => donation.amount));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My account</h1>
          <p className="mt-2 text-zinc-600">
            Your profile and donation history, live from the API.
          </p>
        </div>
        <LogoutButton
          redirectTo="/"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
        <section className="h-fit rounded-xl border border-zinc-200 bg-white p-6">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="font-medium break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Role</dt>
              <dd className="mt-0.5">
                <RoleBadge role={user.role} />
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Member since</dt>
              <dd className="font-medium">{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">User id</dt>
              <dd className="font-mono text-xs text-zinc-600 break-all">
                {user.id}
              </dd>
            </div>
          </dl>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="mt-5 inline-block text-sm font-medium text-amber-800 underline underline-offset-4"
            >
              Open the admin dashboard →
            </Link>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Donation history</h2>
            <p className="text-sm text-zinc-500">
              {donations.length} donation{donations.length === 1 ? "" : "s"} ·{" "}
              {formatAmount(total)} in total
            </p>
          </div>

          {donations.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              You have not donated yet.{" "}
              <Link href="/campaigns" className="underline underline-offset-4">
                Browse the campaigns
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">Display name</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {donations.map((donation) => (
                    <tr key={donation.id}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/campaigns/${donation.campaignId}`}
                          className="font-medium hover:underline"
                        >
                          {campaignTitles.get(donation.campaignId) ??
                            "Unknown campaign"}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {donation.donorName}
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
    </div>
  );
}
