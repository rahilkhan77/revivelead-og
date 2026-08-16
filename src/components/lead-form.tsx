"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_SOURCES, PROPERTY_TYPES } from "@/lib/constants";

export function LeadForm({
  agents,
}: {
  agents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid gap-4 rounded-2xl border border-border p-6 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const result = await createLeadAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok || !result.data) {
          setError(result.error ?? "Unable to create lead.");
          return;
        }
        router.push(`/leads/${result.data.id}`);
      }}
    >
      <Field label="Full name" name="name" required />
      <Field label="Phone" name="phone" />
      <Field label="Email" name="email" type="email" />
      <SelectField label="Source" name="source" options={[...LEAD_SOURCES]} />
      <SelectField label="Property type" name="propertyType" options={[...PROPERTY_TYPES]} />
      <Field label="Location" name="location" />
      <Field label="Budget min" name="budgetMin" type="number" />
      <Field label="Budget max" name="budgetMax" type="number" />
      <SelectField label="Intent" name="intent" options={["UNKNOWN", "BUYING", "RENTING"]} />
      <Field label="Timeline" name="timeline" />
      <Field label="Bedrooms" name="bedrooms" type="number" />
      <div className="space-y-1.5">
        <Label htmlFor="assignedAgentId">Assign agent</Label>
        <select
          id="assignedAgentId"
          name="assignedAgentId"
          className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
        >
          <option value="">Round-robin</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="notes">Notes / conversation</Label>
        <Textarea id="notes" name="notes" rows={4} />
      </div>
      {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Qualifying and saving..." : "Create and qualify"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
