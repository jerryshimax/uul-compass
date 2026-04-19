// Demo AI cost telemetry — board-grade dashboard view of the $300/mo budget.
// Numbers reflect realistic Claude Opus 4.6 + GPT-5.4 fallback pricing.

export interface DemoAiUserUsage {
  userId: string;
  userName: string;
  role: string;
  messageCount: number;
  toolCallCount: number;
  tokensIn: number;
  tokensOut: number;
  tokensCached: number;
  costCents: number;
}

export interface DemoAiToolUsage {
  toolName: string;
  callCount: number;
  successCount: number;
  failureCount: number;
  avgLatencyMs: number;
  costCents: number;
}

export interface DemoAiDailySpend {
  date: string;
  costCents: number;
  messageCount: number;
}

export interface DemoAiConversation {
  id: string;
  userId: string;
  userName: string;
  title: string;
  messageCount: number;
  costCents: number;
  startedAt: string;
}

export const demoAiBudgetCents = 300_00;

export const demoAiMonthlySpend = {
  costCents: 187_43,
  messageCount: 1_842,
  toolCallCount: 612,
  tokensIn: 4_280_000,
  tokensOut: 612_000,
  tokensCached: 1_840_000,
  activeUsers: 9,
  asOfDate: "2026-04-19",
};

export const demoAiDailySpend: DemoAiDailySpend[] = [
  { date: "2026-04-01", costCents: 9_18, messageCount: 84 },
  { date: "2026-04-02", costCents: 11_42, messageCount: 102 },
  { date: "2026-04-03", costCents: 8_64, messageCount: 71 },
  { date: "2026-04-04", costCents: 6_22, messageCount: 58 },
  { date: "2026-04-05", costCents: 4_18, messageCount: 41 },
  { date: "2026-04-06", costCents: 12_84, messageCount: 124 },
  { date: "2026-04-07", costCents: 14_62, messageCount: 138 },
  { date: "2026-04-08", costCents: 11_18, messageCount: 96 },
  { date: "2026-04-09", costCents: 9_86, messageCount: 88 },
  { date: "2026-04-10", costCents: 13_24, messageCount: 119 },
  { date: "2026-04-11", costCents: 7_44, messageCount: 67 },
  { date: "2026-04-12", costCents: 5_12, messageCount: 48 },
  { date: "2026-04-13", costCents: 12_18, messageCount: 108 },
  { date: "2026-04-14", costCents: 15_84, messageCount: 142 },
  { date: "2026-04-15", costCents: 10_62, messageCount: 94 },
  { date: "2026-04-16", costCents: 11_38, messageCount: 102 },
  { date: "2026-04-17", costCents: 9_14, messageCount: 84 },
  { date: "2026-04-18", costCents: 8_86, messageCount: 76 },
  { date: "2026-04-19", costCents: 5_47, messageCount: 49 },
];

export const demoAiUserUsage: DemoAiUserUsage[] = [
  {
    userId: "user-jerry",
    userName: "Jerry Shi",
    role: "Principal",
    messageCount: 412,
    toolCallCount: 138,
    tokensIn: 982_000,
    tokensOut: 142_000,
    tokensCached: 420_000,
    costCents: 42_18,
  },
  {
    userId: "user-david",
    userName: "David Chen",
    role: "Engineering",
    messageCount: 384,
    toolCallCount: 162,
    tokensIn: 1_120_000,
    tokensOut: 168_000,
    tokensCached: 480_000,
    costCents: 48_62,
  },
  {
    userId: "user-season",
    userName: "Season Liu",
    role: "CFO",
    messageCount: 218,
    toolCallCount: 64,
    tokensIn: 524_000,
    tokensOut: 78_000,
    tokensCached: 240_000,
    costCents: 22_84,
  },
  {
    userId: "user-marco",
    userName: "Marco Rodriguez",
    role: "Operations Lead",
    messageCount: 196,
    toolCallCount: 72,
    tokensIn: 462_000,
    tokensOut: 68_000,
    tokensCached: 210_000,
    costCents: 19_42,
  },
  {
    userId: "user-russ",
    userName: "Russ Langley",
    role: "Commercial",
    messageCount: 184,
    toolCallCount: 58,
    tokensIn: 412_000,
    tokensOut: 62_000,
    tokensCached: 184_000,
    costCents: 17_88,
  },
  {
    userId: "user-alic",
    userName: "Alic Ge",
    role: "China Ops",
    messageCount: 142,
    toolCallCount: 48,
    tokensIn: 318_000,
    tokensOut: 48_000,
    tokensCached: 142_000,
    costCents: 13_64,
  },
  {
    userId: "user-ella",
    userName: "Ella Fang",
    role: "Commercial",
    messageCount: 128,
    toolCallCount: 38,
    tokensIn: 284_000,
    tokensOut: 42_000,
    tokensCached: 124_000,
    costCents: 12_18,
  },
  {
    userId: "user-quinn",
    userName: "Quinn Redman",
    role: "Commercial",
    messageCount: 96,
    toolCallCount: 22,
    tokensIn: 184_000,
    tokensOut: 28_000,
    tokensCached: 84_000,
    costCents: 7_84,
  },
  {
    userId: "user-andy",
    userName: "Andy Park",
    role: "Sales",
    messageCount: 82,
    toolCallCount: 12,
    tokensIn: 146_000,
    tokensOut: 22_000,
    tokensCached: 62_000,
    costCents: 6_42,
  },
];

export const demoAiToolUsage: DemoAiToolUsage[] = [
  { toolName: "query_brain", callCount: 184, successCount: 178, failureCount: 6, avgLatencyMs: 842, costCents: 24_18 },
  { toolName: "query_pmi_tasks", callCount: 142, successCount: 142, failureCount: 0, avgLatencyMs: 318, costCents: 8_42 },
  { toolName: "query_customers", callCount: 98, successCount: 96, failureCount: 2, avgLatencyMs: 412, costCents: 6_84 },
  { toolName: "query_projects", callCount: 84, successCount: 82, failureCount: 2, avgLatencyMs: 484, costCents: 5_92 },
  { toolName: "draft_decision", callCount: 42, successCount: 38, failureCount: 4, avgLatencyMs: 1_842, costCents: 12_18 },
  { toolName: "summarize_meeting", callCount: 38, successCount: 36, failureCount: 2, avgLatencyMs: 2_142, costCents: 14_84 },
  { toolName: "create_task", callCount: 24, successCount: 24, failureCount: 0, avgLatencyMs: 284, costCents: 1_42 },
];

export const demoAiTopConversations: DemoAiConversation[] = [
  { id: "conv-1", userId: "user-jerry", userName: "Jerry Shi", title: "Hyperscale 135 MW slack analysis", messageCount: 38, costCents: 4_82, startedAt: "2026-04-18T14:22:00Z" },
  { id: "conv-2", userId: "user-david", userName: "David Chen", title: "Customers schema review", messageCount: 42, costCents: 4_42, startedAt: "2026-04-17T09:18:00Z" },
  { id: "conv-3", userId: "user-season", userName: "Season Liu", title: "Silfab AR aging walkthrough", messageCount: 28, costCents: 3_84, startedAt: "2026-04-18T10:42:00Z" },
  { id: "conv-4", userId: "user-jerry", userName: "Jerry Shi", title: "Compass v2 roadmap synthesis", messageCount: 62, costCents: 8_64, startedAt: "2026-04-19T08:14:00Z" },
  { id: "conv-5", userId: "user-marco", userName: "Marco Rodriguez", title: "Yantian customs hold escalation draft", messageCount: 24, costCents: 2_42, startedAt: "2026-04-16T16:38:00Z" },
];
