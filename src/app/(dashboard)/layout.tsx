import { NavShell } from "@/components/shared/nav-shell";
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
        <NavShell user={userProps}>
          {children}
        </NavShell>
      </div>
    </LanguageProvider>
  );
}
