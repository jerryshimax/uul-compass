"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { logoutAction } from "@/lib/actions/auth";

type UserProps = { fullName: string; email: string; role: string } | null;

export function SideNav({ user, isOpen = false, onClose }: { user: UserProps; isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    }
    if (supportOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [supportOpen]);

  const allNav = [
    { labelKey: "nav_home" as const, icon: "dashboard", href: "/" },
    { labelKey: "nav_plan" as const, icon: "event_note", href: "/plan" },
    { labelKey: "nav_growth" as const, icon: "insights", href: "/value-gains" },
    { labelKey: "nav_sales" as const, icon: "storefront", href: "/sales" },
    { labelKey: "nav_risks" as const, icon: "warning", href: "/risks" },
    { labelKey: "nav_organization" as const, icon: "corporate_fare", href: "/settings" },
  ];

  const myTasksActive = pathname.startsWith("/my-tasks");

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
    <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col bg-slate-950 border-r border-slate-800/50 z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
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
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{t("nav_intelligenceHub")}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {allNav.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={
                  isActive
                    ? "flex items-center gap-3 px-4 py-3 text-blue-200 font-semibold bg-blue-900/30 border-l-4 border-blue-500 transition-all"
                    : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all"
                }
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="font-sans text-sm font-light tracking-wide">{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <Link
            href="/my-tasks"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 mx-0 rounded-lg text-sm font-semibold tracking-wide transition-all ${
              myTasksActive
                ? "bg-[#b4c5ff] text-[#0b1325]"
                : "bg-[#b4c5ff]/15 text-[#b4c5ff] border border-[#b4c5ff]/30 hover:bg-[#b4c5ff]/25"
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={myTasksActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              assignment_turned_in
            </span>
            {t("nav_myTasks")}
          </Link>
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-slate-800/50 space-y-1">
        {/* Support */}
        <div className="relative" ref={supportRef}>
          <button
            onClick={() => setSupportOpen((v) => !v)}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-slate-300 transition-all"
          >
            <span className="material-symbols-outlined">help_outline</span>
            <span className="font-sans text-sm font-light tracking-wide">{t("nav_support")}</span>
          </button>
          {supportOpen && (
            <div className="absolute bottom-12 left-0 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 p-4">
              <p className="text-xs font-semibold text-slate-300 mb-3">Need help?</p>
              <a
                href="mailto:admin@uulglobal.com"
                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span className="material-symbols-outlined text-base">mail</span>
                admin@uulglobal.com
              </a>
              <p className="text-[11px] text-slate-600 mt-2">Contact admin for access issues or technical support.</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => logoutAction()}
          className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-red-400 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-sans text-sm font-light tracking-wide">{t("nav_logout")}</span>
        </button>
      </div>
    </aside>
    </>
  );
}
