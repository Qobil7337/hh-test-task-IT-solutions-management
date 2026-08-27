import type { Role } from "@/lib/types";

const STYLES: Record<Role, string> = {
  ADMIN: "bg-amber-50 text-amber-800 ring-amber-600/20",
  USER: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ring-1 ring-inset ${STYLES[role]}`}
    >
      {role}
    </span>
  );
}
