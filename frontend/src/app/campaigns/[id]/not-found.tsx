import Link from "next/link";

export default function CampaignNotFound() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
      <h1 className="text-xl font-semibold">Campaign not found</h1>
      <p className="mt-2 text-zinc-600">
        This campaign does not exist or the link is invalid.
      </p>
      <Link
        href="/campaigns"
        className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
      >
        ← Back to campaigns
      </Link>
    </div>
  );
}
