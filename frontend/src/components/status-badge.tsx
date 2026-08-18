import type { LeadStatus, LeadTemperature } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusClass: Record<LeadStatus, string> = {
  NEW: "bg-sky-500/12 text-sky-800 border-sky-500/20 dark:text-sky-300",
  CONTACTED: "bg-indigo-500/12 text-indigo-800 border-indigo-500/20 dark:text-indigo-300",
  QUALIFIED: "bg-emerald-500/12 text-emerald-800 border-emerald-500/20 dark:text-emerald-300",
  VIEWING_SCHEDULED: "bg-amber-500/12 text-amber-900 border-amber-500/25 dark:text-amber-200",
  NEGOTIATION: "bg-orange-500/12 text-orange-800 border-orange-500/20 dark:text-orange-300",
  WON: "bg-lime-500/12 text-lime-800 border-lime-500/20 dark:text-lime-300",
  LOST: "bg-rose-500/12 text-rose-800 border-rose-500/20 dark:text-rose-300",
  DORMANT: "bg-zinc-500/12 text-zinc-700 border-zinc-500/20 dark:text-zinc-300",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusClass[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function TemperatureBadge({ value }: { value: LeadTemperature }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        value === "HOT" && "bg-red-500/12 text-red-800 border-red-500/20 dark:text-red-300",
        value === "WARM" && "bg-amber-500/12 text-amber-900 border-amber-500/25 dark:text-amber-200",
        value === "COLD" && "bg-slate-500/12 text-slate-700 border-slate-500/20 dark:text-slate-300",
      )}
    >
      {value}
    </Badge>
  );
}
