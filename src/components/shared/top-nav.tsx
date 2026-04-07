"use client";

import Link from "next/link";

export function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950 backdrop-blur-xl border-b border-slate-800/50 flex justify-between items-center px-6 h-16">
      <Link href="/" className="font-serif text-blue-200 tracking-widest text-xl hover:text-blue-100 transition-colors">
        UUL Global
      </Link>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search..."
            className="bg-slate-900/40 border border-slate-800 text-xs px-4 py-2 w-48 rounded-lg focus:ring-1 focus:ring-blue-400/30 text-blue-100"
          />
        </div>
        <span className="material-symbols-outlined text-blue-200 cursor-pointer">notifications</span>
        <span className="material-symbols-outlined text-blue-200 cursor-pointer">account_circle</span>
      </div>
    </nav>
  );
}
