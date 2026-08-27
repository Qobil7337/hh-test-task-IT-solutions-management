import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { CampaignImage } from "@/components/campaign-image";
import { DonationForm } from "@/components/donation-form";
import { LogoutButton } from "@/components/logout-button";
import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/status-badge";
import { getCampaign, getDonations } from "@/lib/api";
import { formatAmount, formatDate } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const RECENT_DONATIONS_LIMIT = 10;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getCampaign(id);
  return { title: campaign?.title ?? "Campaign" };
}

export default async function CampaignDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [donations, user] = await Promise.all([
    getDonations(campaign.id),
    getSessionUser(),
  ]);
  const recentDonations = donations.slice(0, RECENT_DONATIONS_LIMIT);
  const remaining = (
    Number(campaign.targetAmount) - Number(campaign.collectedAmount)
  ).toFixed(2);

  return (
    <div>
      <Link
        href="/campaigns"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← All campaigns
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <article>
          <CampaignImage
            id={campaign.id}
            title={campaign.title}
            className="aspect-[21/9] rounded-xl"
          />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {campaign.title}
            </h1>
            <StatusBadge status={campaign.status} />
            {user?.role === "ADMIN" && (
              <Link
                href={`/admin/campaigns/${campaign.id}`}
                className="ml-auto text-sm font-medium text-amber-800 underline underline-offset-4"
              >
                Manage campaign
              </Link>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            Created {formatDate(campaign.createdAt)}
          </p>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-zinc-700">
            {campaign.description}
          </p>

          <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
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

          <section className="mt-8">
            <h2 className="font-semibold">Recent donations</h2>
            {recentDonations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No donations yet — be the first.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
                {recentDonations.map((donation) => (
                  <li
                    key={donation.id}
                    className="flex items-center justify-between px-5 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{donation.donorName}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(donation.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-700">
                      {formatAmount(donation.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-6">
          <h2 className="font-semibold">Make a donation</h2>
          {campaign.status !== "ACTIVE" ? (
            <p className="mt-3 text-sm text-zinc-600">
              This campaign is {campaign.status.toLowerCase()} and no longer
              accepts donations.
            </p>
          ) : user ? (
            <>
              <p className="mt-1 flex items-center justify-between text-sm text-zinc-500">
                <span>
                  Signed in as{" "}
                  <span className="font-medium text-zinc-800">{user.name}</span>
                </span>
                <LogoutButton />
              </p>
              <DonationForm
                campaignId={campaign.id}
                defaultDonorName={user.name}
                remaining={remaining}
              />
              <p className="mt-4 text-xs text-zinc-500">
                <Link
                  href="/account"
                  className="underline underline-offset-2 hover:text-zinc-900"
                >
                  Your donation history →
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-zinc-500">
                Sign in or create an account to donate.
              </p>
              <AuthForm />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
