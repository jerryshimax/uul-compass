"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserProps = { fullName: string; email: string; role: string } | null;

function makeInitials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).join("").slice(0, 2).toUpperCase();
}

export function TopNav({ user, onMenuToggle }: { user: UserProps; onMenuToggle?: () => void }) {
  const { lang, setLang } = useLanguage();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950 backdrop-blur-xl border-b border-slate-800/50 flex justify-between items-center px-6 h-16">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link href="/" className="font-serif text-blue-200 tracking-widest text-xl hover:text-blue-100 transition-colors">
          UUL Global
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search..."
            className="bg-slate-900/40 border border-slate-800 text-xs px-4 py-2 w-48 rounded-lg focus:ring-1 focus:ring-blue-400/30 text-blue-100"
          />
        </div>

        {/* Language toggle */}
        <div className="flex items-center rounded-lg border border-slate-700 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => setLang("en")}
            className={`px-3 py-1.5 transition-colors ${lang === "en" ? "bg-blue-900/60 text-blue-200" : "text-slate-500 hover:text-slate-300"}`}
          >
            EN
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={() => setLang("zh")}
            className={`px-3 py-1.5 transition-colors ${lang === "zh" ? "bg-blue-900/60 text-blue-200" : "text-slate-500 hover:text-slate-300"}`}
          >
            中
          </button>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative text-blue-200 hover:text-blue-100 transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Notifications</p>
              </div>
              <div className="px-4 py-8 text-center">
                <span className="material-symbols-outlined text-slate-600 text-4xl">notifications_none</span>
                <p className="text-xs text-slate-500 mt-2">No new notifications</p>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-900/60 border border-blue-400/20 text-blue-200 text-xs font-semibold hover:bg-blue-900 transition-colors">
            {user ? makeInitials(user.fullName) : <span className="material-symbols-outlined text-base">account_circle</span>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 bg-slate-900 border-slate-800">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="pb-1">
                <p className="text-sm font-semibold text-slate-200">{user?.fullName ?? "—"}</p>
                <p className="text-xs text-slate-500 font-normal">{user?.email ?? ""}</p>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-0.5">{user?.role ?? ""}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
