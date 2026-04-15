import { NavShell } from "@/components/shared/nav-shell";
import { LanguageProvider } from "@/lib/i18n/context";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import { ChatProvider } from "@/components/ai/chat-provider";
import { ChatFab } from "@/components/ai/chat-fab";
import { ChatPanel } from "@/components/ai/chat-panel";
import { PageBridgeProvider } from "@/lib/ai/page-bridge";

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
      <ChatProvider>
        <PageBridgeProvider>
          <div className="min-h-screen bg-[#0b1325]">
            <NavShell user={userProps}>
              {children}
            </NavShell>
            <ChatFab />
            <ChatPanel />
          </div>
        </PageBridgeProvider>
      </ChatProvider>
    </LanguageProvider>
  );
}
