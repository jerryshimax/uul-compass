import { SideNav } from "@/components/shared/side-nav";
import { TopNav } from "@/components/shared/top-nav";
import { BottomNav } from "@/components/shared/bottom-nav";
import { LanguageProvider } from "@/lib/i18n/context";
import { getCurrentUser } from "@/lib/supabase/get-current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const userProps = user
    ? { fullName: user.fullName, email: user.email, role: user.role }
    : null;

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#0b1325]">
        <TopNav user={userProps} />
        <SideNav user={userProps} />
        <main className="lg:ml-64 pt-24 pb-24 lg:pb-8 px-6 min-h-screen">
          {children}
        </main>
        <BottomNav />
      </div>
    </LanguageProvider>
  );
}
