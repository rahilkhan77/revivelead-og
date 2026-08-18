"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  Bell,
  Building2,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCcw,
  Search,
  Settings,
  Users,
  Workflow,
  MessageSquare,
  Contact,
  CalendarClock,
  Database,
  Upload,
  Home,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { markNotificationsReadAction } from "@/actions/settings";
import { UserButton, useAuth } from "@clerk/nextjs";
import { BrandLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/intelligence", label: "Intelligence", icon: Database },
  { href: "/import", label: "Import Center", icon: Upload },
  { href: "/leads", label: "Leads", icon: Contact },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { href: "/reactivation", label: "Reactivation", icon: RefreshCcw },
  { href: "/revenue", label: "Revenue recovery", icon: CircleDollarSign },
  { href: "/team", label: "Team", icon: Users },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/billing", label: "Billing", icon: Building2 },
];

type SearchHit = { id: string; name: string; location: string | null; status: string };

function SidebarSessionActions() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return (
    <form action={logoutAction}>
      <Button type="submit" size="icon-sm" variant="ghost" aria-label="Log out">
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}

export function AppShell({
  user,
  unread = 0,
  unreadSlot,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role; organizationName: string };
  unread?: number;
  unreadSlot?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setHits([]);
        return;
      }
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = (await response.json()) as { leads: SearchHit[] };
        setHits(data.leads);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const items = useMemo(() => nav, []);

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-4">
        <BrandLogo href="/dashboard" size="sm" />
        <p className="mt-2 truncate px-0.5 type-small text-muted-foreground">{user.organizationName}</p>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="size-9">
          <AvatarFallback>{initials(user.name ?? "U")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
        <SidebarSessionActions />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">{sidebar}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
          <div className="relative max-w-xl flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search leads, locations, phones..."
              aria-label="Search leads"
              className="pl-9"
            />
            {hits.length > 0 && (
              <div className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                {hits.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setQuery("");
                      setHits([]);
                      router.push(`/leads/${hit.id}`);
                    }}
                  >
                    <span>{hit.name}</span>
                    <span className="text-xs text-muted-foreground">{hit.location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Mark notifications read"
            onClick={() => {
              startTransition(() => {
                void markNotificationsReadAction();
              });
            }}
          >
            <Bell className="size-4" />
            {unreadSlot ??
              (unread > 0 ? <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" /> : null)}
          </Button>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
