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
      <div className="flex size-11 items-center justify-center rounded-md border border-border bg-muted/40">
        <Inbox className="size-5 text-muted-foreground" />
      </div>
      <div>
        <h3 className="type-h3">{title}</h3>
        <p className="type-small mt-1.5 max-w-md text-muted-foreground">{description}</p>
      </div>
      {action}
    </Card>
  );
}
