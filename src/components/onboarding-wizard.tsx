"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Organization } from "@prisma/client";
import { completeOnboardingAction, saveOnboardingAction, saveOnboardingFollowUpsAction } from "@/actions/onboarding";
import { updateIntegrationAction } from "@/actions/settings";
import { TeamInviteForm } from "@/components/team-invite-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrgSettings } from "@/lib/constants";
import type { PublicIntegration } from "@/lib/integrations/public";
import { COUNTRIES, CURRENCIES, defaultsForCountry } from "@/lib/markets";
import { toast } from "sonner";

const STEPS = [
  "Market",
  "Company",
  "Team",
  "WhatsApp",
  "Import",
  "Follow-ups",
  "Done",
] as const;

export function OnboardingWizard({
  organization,
  settings,
  whatsapp,
}: {
  organization: Organization;
  settings: OrgSettings;
  whatsapp: PublicIntegration | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(organization.country || "UAE");
  const countryDefaults = useMemo(() => defaultsForCountry(country), [country]);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <div className="mt-4 rounded-2xl border border-border p-5">
        {step === 0 ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await saveOnboardingAction(new FormData(event.currentTarget));
              if (!result.ok) toast.error(result.error);
              else setStep(1);
            }}
          >
            <FieldSelect label="Country" name="country" value={country} onChange={setCountry} options={[...COUNTRIES]} />
            <FieldSelect label="Market" name="market" defaultValue={organization.market} options={countryDefaults.markets} />
            <Field label="Timezone" name="timezone" defaultValue={organization.timezone || countryDefaults.timezone} />
            <FieldSelect label="Currency" name="currency" defaultValue={organization.currency || countryDefaults.currency} options={[...CURRENCIES]} />
            <Button type="submit">Continue</Button>
          </form>
        ) : null}

        {step === 1 ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await saveOnboardingAction(new FormData(event.currentTarget));
              if (!result.ok) toast.error(result.error);
              else setStep(2);
            }}
          >
            <input type="hidden" name="country" value={country} />
            <Field label="Agency name" name="name" defaultValue={organization.name} />
            <p className="text-sm text-muted-foreground">
              This creates your own agency workspace. You will never be placed in the Al Noor demo organization.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Invite teammates now, or skip and do this later from Team.</p>
            <TeamInviteForm />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (whatsapp) {
                const result = await updateIntegrationAction(new FormData(event.currentTarget));
                if (!result.ok) {
                  toast.error(result.error);
                  return;
                }
                toast.success("WhatsApp settings saved");
              }
              setStep(4);
            }}
          >
            {whatsapp ? (
              <>
                <input type="hidden" name="id" value={whatsapp.id} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="enabled" defaultChecked={whatsapp.enabled} />
                  Enable WhatsApp
                </label>
                <Field label="Phone number ID" name="phoneNumberId" defaultValue={whatsapp.config.phoneNumberId} />
                <Field label="Business account ID" name="businessAccountId" defaultValue={whatsapp.config.businessAccountId} />
                <Field label="Access token" name="accessToken" type="password" placeholder={whatsapp.config.accessTokenHint || "Paste token"} />
                <Field label="From number" name="fromNumber" defaultValue={whatsapp.config.fromNumber} />
                <Field label="Webhook secret" name="webhookSecret" type="password" placeholder={whatsapp.config.webhookSecretHint || "Verify token"} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">WhatsApp integration is missing. Continue and add it from Settings later.</p>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import existing enquiries as a CSV, or skip and add leads later.
            </p>
            <Button asChild variant="outline">
              <Link href="/leads/import">Open CSV import</Link>
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button type="button" onClick={() => setStep(5)}>Continue</Button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await saveOnboardingFollowUpsAction(new FormData(event.currentTarget));
              if (!result.ok) toast.error(result.error);
              else setStep(6);
            }}
          >
            <Field label="Immediate (minutes)" name="immediateResponseMinutes" type="number" defaultValue={String(settings.followUp.immediateResponseMinutes)} />
            <Field label="+1 day (hours)" name="firstFollowUpHours" type="number" defaultValue={String(settings.followUp.firstFollowUpHours)} />
            <Field label="+3 days (hours)" name="secondFollowUpHours" type="number" defaultValue={String(settings.followUp.secondFollowUpHours)} />
            <Field label="+7 days (hours)" name="agentAlertHours" type="number" defaultValue={String(settings.followUp.agentAlertHours)} />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(4)}>Back</Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        ) : null}

        {step === 6 ? (
          <div className="space-y-4">
            <p className="text-lg font-medium">Your agency is ready.</p>
            <p className="text-sm text-muted-foreground">
              Next: import leads, connect WhatsApp if you have not, then watch recovered revenue on the dashboard.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(5)}>Back</Button>
              <Button
                type="button"
                onClick={async () => {
                  const result = await completeOnboardingAction();
                  if (!result.ok) toast.error(result.error);
                  else {
                    router.push("/dashboard");
                    router.refresh();
                  }
                }}
              >
                Go to dashboard
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} />
    </div>
  );
}

function FieldSelect({
  label,
  name,
  options,
  defaultValue,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        defaultValue={value ? undefined : defaultValue}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="border-input bg-background h-8 w-full rounded-lg border px-2 text-sm"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
