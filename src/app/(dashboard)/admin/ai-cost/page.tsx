import {
  demoAiBudgetCents,
  demoAiMonthlySpend,
  demoAiDailySpend,
  demoAiUserUsage,
  demoAiToolUsage,
  demoAiTopConversations,
} from "@/lib/data/demo/ai-usage";
import { AiCostContent } from "./ai-cost-content";

export default function AiCostPage() {
  return (
    <AiCostContent
      budgetCents={demoAiBudgetCents}
      monthly={demoAiMonthlySpend}
      daily={demoAiDailySpend}
      users={demoAiUserUsage}
      tools={demoAiToolUsage}
      topConversations={demoAiTopConversations}
    />
  );
}
