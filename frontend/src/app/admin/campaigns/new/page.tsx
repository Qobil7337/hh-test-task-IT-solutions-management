import type { Metadata } from "next";
import Link from "next/link";
import { createCampaignAction } from "@/app/admin/actions";
import { CampaignForm } from "@/components/campaign-form";

export const metadata: Metadata = { title: "New campaign" };

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        New campaign
      </h1>
      <p className="mt-2 text-zinc-600">
        New campaigns start as <span className="font-medium">Active</span> with
        nothing collected and appear on the public campaigns page immediately.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <CampaignForm
          action={createCampaignAction}
          submitLabel="Create campaign"
        />
      </div>
    </div>
  );
}
