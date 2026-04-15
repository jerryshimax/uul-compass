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
      if (feedbackRef.current && !feedbackRef.current.contains(e.target as Node)) {
        setFeedbackOpen(false);
      }
    }
    if (supportOpen || feedbackOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [supportOpen, feedbackOpen]);

  async function submitFeedback() {
    if (!feedbackText.trim()) return;
    setFeedbackStatus("sending");
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: feedbackType, message: feedbackText }),
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

  const allNav = [
    { labelKey: "nav_home" as const, icon: "dashboard", href: "/" },
    { labelKey: "nav_chat" as const, icon: "assistant", href: "/chat" },
    { labelKey: "nav_decisions" as const, icon: "gavel", href: "/decisions" },
    { labelKey: "nav_growth" as const, icon: "insights", href: "/value-gains" },
    { labelKey: "nav_pipeline" as const, icon: "timeline", href: "/pipeline" },
    { labelKey: "nav_risks" as const, icon: "warning", href: "/risks" },
    { labelKey: "nav_people" as const, icon: "group", href: "/people" },
  ];

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
        <div className="relative" ref={feedbackRef}>
          <button
            onClick={() => { setFeedbackOpen((v) => !v); setSupportOpen(false); }}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-500 hover:text-slate-300 transition-all"
          >
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            <span className="font-sans text-sm font-light tracking-wide">{t("nav_feedback")}</span>
          </button>
          {feedbackOpen && (
            <div className="absolute bottom-12 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 p-4">
              {feedbackStatus === "sent" ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                  <p className="text-xs text-emerald-400 font-medium">Thanks for your feedback!</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Send Feedback</p>
                  <div className="flex gap-1 mb-3">
                    {(["bug", "idea", "question", "praise"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFeedbackType(type)}
                        className={`flex-1 py-1 rounded text-[10px] font-medium capitalize transition-colors ${
                          feedbackType === type
                            ? "bg-[#b4c5ff]/20 text-[#b4c5ff]"
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-slate-600 mb-3"
                  />
                  <button
                    onClick={submitFeedback}
                    disabled={!feedbackText.trim() || feedbackStatus === "sending"}
                    className="w-full py-1.5 rounded-lg bg-[#b4c5ff]/15 text-[#b4c5ff] text-xs font-medium hover:bg-[#b4c5ff]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {feedbackStatus === "sending" ? "Sending…" : "Send"}
                  </button>
                </>
              )}
            </div>
          )}
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
}
