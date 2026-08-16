import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted/40">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-base font-medium">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  );
}
