import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, TemperatureBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser, canViewAllLeads } from "@/lib/authz";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatBudget, formatRelative } from "@/lib/format";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { db } from "@/lib/db";
import type { LeadStatus, LeadTemperature } from "@prisma/client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; temp?: string; page?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const status = params.status as LeadStatus | undefined;
  const temp = params.temp as LeadTemperature | undefined;
  const pageSize = 20;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const where = {
    ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)),
    ...(status ? { status } : {}),
    ...(temp ? { temperature: temp } : {}),
    ...(params.q
      ? {
          OR: [
            { name: { contains: params.q } },
            { location: { contains: params.q } },
            { phone: { contains: params.q } },
          ],
        }
      : {}),
  };

  const [total, leads] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      include: { assignedAgent: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Every enquiry your agency captured, scored and assigned."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/leads/import">Import CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          </div>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Filter by name, area or phone"
          className="border-input bg-background h-8 rounded-lg border px-3 text-sm"
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          name="temp"
          defaultValue={params.temp ?? ""}
          className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
        >
          <option value="">All temperatures</option>
          <option value="HOT">Hot</option>
          <option value="WARM">Warm</option>
          <option value="COLD">Cold</option>
        </select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>
      {leads.length === 0 ? (
        <EmptyState
          title="No leads match these filters"
          description="Add a lead or ingest one from the API / n8n webhook."
          action={
            <Button asChild>
              <Link href="/leads/new">Add lead</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Last contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {lead.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{lead.source}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.propertyType ?? "—"}
                    <p className="text-xs text-muted-foreground">{lead.location}</p>
                  </TableCell>
                  <TableCell>{formatBudget(lead.budgetMin, lead.budgetMax, lead.currency)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{lead.leadScore}</span>
                      <TemperatureBadge value={lead.temperature} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status} />
                  </TableCell>
                  <TableCell className="text-sm">{lead.assignedAgent?.name ?? "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatRelative(lead.lastContactedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pages > 1 ? (
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                {total} leads · page {page} of {pages}
              </span>
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link className="underline-offset-4 hover:underline" href={leadPageHref(params, page - 1)}>
                    Previous
                  </Link>
                ) : null}
                {page < pages ? (
                  <Link className="underline-offset-4 hover:underline" href={leadPageHref(params, page + 1)}>
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function leadPageHref(
  params: { status?: string; q?: string; temp?: string },
  page: number,
) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.temp) query.set("temp", params.temp);
  query.set("page", String(page));
  return `/leads?${query.toString()}`;
}
