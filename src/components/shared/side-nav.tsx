"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/lib/i18n/context";
import { logoutAction } from "@/lib/actions/auth";

type UserProps = { fullName: string; email: string; role: string } | null;

const ADMIN_ROLES = new Set(["owner", "board", "executive"]);

export function SideNav({ user, isOpen = false, onClose }: { user: UserProps; isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [supportOpen, setSupportOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"bug" | "idea" | "question" | "praise">("idea");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent">("idle");
  const supportRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    }
    if (supportOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [supportOpen]);

  async function submitFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbackStatus("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: feedbackType, body: feedbackText }),
      });
      setFeedbackStatus("sent");
      setTimeout(() => {
        setFeedbackOpen(false);
        setFeedbackStatus("idle");
        setFeedbackText("");
        setFeedbackType("idea");
      }, 1500);
    } catch {
      setFeedbackStatus("idle");
    }
  }

  const isAdmin = user ? ADMIN_ROLES.has(user.role) : false;

  const allNav = [
    { labelKey: "nav_home" as const, icon: "dashboard", href: "/" },
    { labelKey: "nav_chat" as const, icon: "assistant", href: "/chat" },
    { labelKey: "nav_decisions" as const, icon: "gavel", href: "/decisions" },
    { labelKey: "nav_finance" as const, icon: "account_balance", href: "/finance" },
    { labelKey: "nav_pipeline" as const, icon: "timeline", href: "/pipeline" },
    { labelKey: "nav_risks" as const, icon: "warning", href: "/risks" },
    { labelKey: "nav_people" as const, icon: "group", href: "/people" },
    ...(isAdmin ? [{ labelKey: "nav_admin" as const, icon: "admin_panel_settings", href: "/admin" }] : []),
  ];

  const nav = (
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
                    ? "flex items-center gap-3 px-4 py-3 text-blue-200 font-semibold bg-blue-900/30 border-l-4 border-blue-500 transition-all active:opacity-60"
                    : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all active:opacity-60"
                }
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.icon}
                </span>
                <span className="font-sans text-sm font-light tracking-wide">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-slate-800/50 space-y-1">
        {/* Feedback */}
        <div ref={feedbackRef}>
          <button
            onClick={() => { setFeedbackOpen((v) => !v); setSupportOpen(false); }}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-slate-300 transition-all"
          >
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            <span className="font-sans text-sm font-light tracking-wide">{t("nav_feedback")}</span>
          </button>
        </div>


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

  return (
    <>
      {nav}
      {feedbackOpen && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)" }}
            onClick={() => setFeedbackOpen(false)}
          />
          {/* Modal */}
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(560px, calc(100vw - 2rem))",
            zIndex: 10000,
          }} className="bg-[#0f1829] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/70 overflow-hidden">
            {feedbackStatus === "sent" ? (
              <div className="flex flex-col items-center gap-4 py-16">
                <span className="material-symbols-outlined text-emerald-400" style={{ fontSize: 48 }}>check_circle</span>
                <p className="text-base text-emerald-400 font-medium">Thanks — we&apos;ll look into it.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#b4c5ff]">chat_bubble_outline</span>
                    <h2 className="font-serif text-xl text-white">Send Feedback</h2>
                  </div>
                  <button onClick={() => setFeedbackOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-4 gap-2">
                    {([
                      { key: "bug",      icon: "bug_report",   label: "Bug",      desc: "Something is broken" },
                      { key: "idea",     icon: "lightbulb",    label: "Idea",     desc: "Feature or improvement" },
                      { key: "question", icon: "help_outline", label: "Question", desc: "I need help" },
                      { key: "praise",   icon: "thumb_up",     label: "Praise",   desc: "Something I love" },
                    ] as const).map(({ key, icon, label, desc }) => (
                      <button
                        key={key}
                        onClick={() => setFeedbackType(key)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                          feedbackType === key
                            ? "bg-[#1a2744] border-[#b4c5ff]/40 text-[#b4c5ff]"
                            : "bg-[#131b2d] border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl" style={feedbackType === key ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {icon}
                        </span>
                        <span className="text-xs font-semibold">{label}</span>
                        <span className="text-[11px] opacity-60 leading-tight text-center">{desc}</span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      feedbackType === "bug"      ? "What happened? What did you expect?" :
                      feedbackType === "idea"     ? "Describe the feature or improvement..." :
                      feedbackType === "question" ? "What do you need help with?" :
                      "What are you enjoying?"
                    }
                    rows={5}
                    autoFocus
                    className="w-full bg-[#131b2d] border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-slate-600 leading-relaxed"
                  />
                  <button
                    onClick={submitFeedback}
                    disabled={!feedbackText.trim() || feedbackStatus === "sending"}
                    className="w-full py-3 rounded-xl bg-[#b4c5ff]/15 text-[#b4c5ff] text-sm font-medium hover:bg-[#b4c5ff]/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {feedbackStatus === "sending" ? "Sending…" : "Send Feedback"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
