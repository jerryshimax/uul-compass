"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

interface RippleItem {
  id: number;
  x: number;
  y: number;
  size: number;
}

function triggerRipple(
  e: React.MouseEvent | React.TouchEvent,
  setRipples: React.Dispatch<React.SetStateAction<RippleItem[]>>
) {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();

  let clientX: number, clientY: number;
  if ("touches" in e && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = (e as React.MouseEvent).clientX;
    clientY = (e as React.MouseEvent).clientY;
  }

  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const size = Math.max(rect.width, rect.height) * 2;
  const id = Date.now() + Math.random();

  setRipples((prev) => [...prev, { id, x, y, size }]);
  setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
}

function RippleSpots({ ripples }: { ripples: RippleItem[] }) {
  return (
    <>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/20 pointer-events-none animate-ripple"
          style={{
            left: r.x - r.size / 2,
            top: r.y - r.size / 2,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </>
  );
}

// Drop-in replacement for Next.js Link with ripple feedback
export function RippleLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const fire = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => triggerRipple(e, setRipples),
    []
  );

  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseDown={fire}
      onTouchStart={fire}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <RippleSpots ripples={ripples} />
      {children}
    </Link>
  );
}

// Drop-in replacement for <button> with ripple feedback
export function RippleButton({
  onClick,
  className,
  children,
  type = "button",
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}) {
  const [ripples, setRipples] = useState<RippleItem[]>([]);
  const fire = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => triggerRipple(e, setRipples),
    []
  );

  return (
    <button
      type={type}
      onClick={onClick}
      onMouseDown={fire}
      onTouchStart={fire}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <RippleSpots ripples={ripples} />
      {children}
    </button>
  );
}
