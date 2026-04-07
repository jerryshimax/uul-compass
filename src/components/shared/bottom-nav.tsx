"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", icon: "home", href: "/" },
  { label: "Tasks", icon: "event_note", href: "/plan" },
  { label: "Sales", icon: "storefront", href: "/sales" },
  { label: "My Tasks", icon: "assignment_turned_in", href: "/my-tasks" },
  { label: "Risks", icon: "warning", href: "/risks" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-slate-950 backdrop-blur-md border-t border-slate-800/50 flex justify-around items-center h-20 pb-[env(safe-area-inset-bottom)] px-4">
      {items.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive
                ? "flex flex-col items-center justify-center text-blue-200 bg-blue-900/30 rounded-xl px-3 py-1"
                : "flex flex-col items-center justify-center text-slate-500"
            }
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-sans text-[10px] uppercase tracking-tighter">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
