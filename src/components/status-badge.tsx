import type { LeadStatus, LeadTemperature } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusClass: Record<LeadStatus, string> = {
  NEW: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  CONTACTED: "bg-indigo-500/15 text-indigo-300 border-indigo-500/20",
  QUALIFIED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  VIEWING_SCHEDULED: "bg-amber-500/15 text-amber-200 border-amber-500/20",
  NEGOTIATION: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  WON: "bg-lime-500/15 text-lime-300 border-lime-500/20",
  LOST: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  DORMANT: "bg-zinc-500/15 text-zinc-300 border-zinc-500/20",
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
        value === "HOT" && "bg-red-500/15 text-red-300 border-red-500/20",
        value === "WARM" && "bg-amber-500/15 text-amber-200 border-amber-500/20",
        value === "COLD" && "bg-slate-500/15 text-slate-300 border-slate-500/20",
      )}
    >
      {value}
    </Badge>
  );
}
