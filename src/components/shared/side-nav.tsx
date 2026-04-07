"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNav = [
  { label: "Overview", icon: "dashboard", href: "/" },
  { label: "Tasks", icon: "event_note", href: "/plan" },
  { label: "Initiatives", icon: "insights", href: "/value-gains" },
  { label: "Sales", icon: "storefront", href: "/sales" },
  { label: "Risks", icon: "warning", href: "/risks" },
];

const systemNav = [
  { label: "Organization", icon: "corporate_fare", href: "/settings" },
];

export function SideNav() {
  const pathname = usePathname();
  const myTasksActive = pathname.startsWith("/my-tasks");

  return (
    <aside className="fixed left-0 top-0 h-full w-64 hidden lg:flex flex-col bg-slate-950 border-r border-slate-800/50 z-40 overflow-y-auto">
      <div className="p-6 pt-24">
        {/* Identity */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#00389a] flex items-center justify-center border border-blue-400/20">
            <span className="material-symbols-outlined text-blue-200" style={{ fontVariationSettings: "'FILL' 1" }}>
              compass_calibration
            </span>
          </div>
          <div>
            <p className="font-serif text-blue-100 text-sm">Compass OS</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Intelligence Hub</p>
          </div>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "flex items-center gap-3 px-4 py-3 text-blue-200 font-semibold bg-blue-900/30 border-l-4 border-blue-500 transition-all"
                    : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all"
                }
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="font-sans text-sm font-light tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* My Tasks — prominent button */}
        <div className="mt-6">
          <Link
            href="/my-tasks"
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              myTasksActive
                ? "bg-[#b4c5ff] text-[#0b1325]"
                : "bg-[#b4c5ff]/15 text-[#b4c5ff] border border-[#b4c5ff]/30 hover:bg-[#b4c5ff]/25"
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={myTasksActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              assignment_turned_in
            </span>
            My Tasks
          </Link>
        </div>

        {/* System Nav */}
        <div className="mt-6 pt-4 border-t border-slate-800/30 space-y-1">
          {systemNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive
                    ? "flex items-center gap-3 px-4 py-3 text-blue-200 font-semibold bg-blue-900/30 border-l-4 border-blue-500 transition-all"
                    : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all"
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-sans text-sm font-light tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-slate-800/50">
        <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 transition-all">
          <span className="material-symbols-outlined">help_outline</span>
          <span className="font-sans text-sm font-light tracking-wide">Support</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 transition-all">
          <span className="material-symbols-outlined">logout</span>
          <span className="font-sans text-sm font-light tracking-wide">Logout</span>
        </a>
      </div>
    </aside>
  );
}
