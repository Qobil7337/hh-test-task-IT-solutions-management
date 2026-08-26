import type { Metadata } from "next";
import { CampaignCard } from "@/components/campaign-card";
import { getCampaigns } from "@/lib/api";

export const metadata: Metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-2 text-zinc-600">
          Live data from the CharityHub GraphQL API.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
          No campaigns yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
