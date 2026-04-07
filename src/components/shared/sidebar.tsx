"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavBySection } from "./nav-items";
import { Compass } from "lucide-react";
import { calcDayNumber } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const dayNumber = calcDayNumber("2026-04-01", 100);
  const totalDays = 100;
  const pct = Math.round((dayNumber / totalDays) * 100);

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border/30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 shadow-sm shadow-sidebar-primary/20">
          <Compass className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight">Compass</span>
          <p className="text-[10px] text-sidebar-foreground/40 leading-tight">UUL Global</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <NavSection label="Main">
          {getNavBySection("main").map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </NavSection>

        <NavSection label="Tracking">
          {getNavBySection("tracking").map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </NavSection>

        <NavSection label="Operations">
          {getNavBySection("operations").map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </NavSection>

        <NavSection label="System">
          {getNavBySection("system").map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </NavSection>
      </nav>

      {/* Footer — day counter with mini progress */}
      <div className="px-5 py-4 border-t border-sidebar-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-sidebar-foreground/70">Day {dayNumber} of {totalDays}</span>
          </div>
          <span className="text-[10px] tabular-nums text-sidebar-foreground/40">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-sidebar-accent overflow-hidden">
          <div
            className="h-full rounded-full bg-sidebar-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-sidebar-foreground/30 mt-2">
          Apr 1 — Jul 10, 2026
        </p>
      </div>
    </aside>
  );
}

function NavSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 first:pt-0">
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/30">
        {label}
      </p>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; phase?: number };
  pathname: string;
}) {
  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const Icon = item.icon;
  const isDisabled = item.phase && item.phase > 1;

  return (
    <Link
      href={isDisabled ? "#" : item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary font-medium"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground/90",
        isDisabled && "opacity-20 pointer-events-none"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
      {isDisabled && (
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-sidebar-foreground/8 text-sidebar-foreground/30">
          P{item.phase}
        </span>
      )}
    </Link>
  );
}
