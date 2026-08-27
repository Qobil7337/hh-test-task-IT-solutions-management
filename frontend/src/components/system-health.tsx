import { getHealth } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import type { Health } from "@/lib/types";

/** Live `health` query: application liveness and database connectivity. */
export async function SystemHealth() {
  let health: Health | null = null;
  try {
    health = await getHealth();
  } catch {
    health = null; // API unreachable
  }

  return (
    <section className="h-fit rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="font-semibold">System health</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <HealthRow
          label="API"
          up={health?.status === "ok"}
          text={health?.status ?? "unreachable"}
        />
        <HealthRow
          label="Database"
          up={health?.database === "up"}
          text={health?.database ?? "unknown"}
        />
      </dl>
      <p className="mt-3 text-xs text-zinc-500">
        {health
          ? `Checked ${formatDateTime(health.timestamp)}`
          : "The CharityHub API did not respond."}
      </p>
    </section>
  );
}

function HealthRow({
  label,
  up,
  text,
}: {
  label: string;
  up: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="inline-flex items-center gap-2 font-medium">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${up ? "bg-emerald-500" : "bg-red-500"}`}
        />
        {text}
      </dd>
    </div>
  );
}
