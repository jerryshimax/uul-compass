"use client";

import { useState } from "react";
import { TopNav } from "./top-nav";
import { SideNav } from "./side-nav";

type UserProps = { fullName: string; email: string; role: string } | null;

export function NavShell({ user, children }: { user: UserProps; children: React.ReactNode }) {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <>
      <TopNav user={user} onMenuToggle={() => setSideOpen((v) => !v)} />
      <SideNav user={user} isOpen={sideOpen} onClose={() => setSideOpen(false)} />
      <main className="lg:ml-64 pt-16 pb-8 px-6 min-h-screen">
        {children}
      </main>
    </>
  );
}
