// Sales Intelligence demo data — from Jason Likens' spec (2026-04-06)

export interface SalesVertical {
  name: string;
  color: string;
  pipelineValue: number;
  deals: number;
  winRate: number;
}

export interface SalesRep {
  name: string;
  role: string;
  pipeline: number;
  activities: number;
  staleDays: number;
  quota: number;
}

export interface SalesAlert {
  type: "danger" | "warning" | "info" | "success";
  text: string;
  source: string;
}

export interface PipelineStage {
  name: string;
  count: number;
  value: number;
  color: string;
  avgDays: number;
}

export interface VelocityTrend {
  stage: string;
  days: number;
  prevDays: number;
  color: string;
}

export interface ForecastScenario {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export const demoVerticals: SalesVertical[] = [
  { name: "Renewable Energy", color: "#06b6d4", pipelineValue: 8420000, deals: 14, winRate: 68 },
  { name: "Data Centers & AI", color: "#8b5cf6", pipelineValue: 6180000, deals: 9, winRate: 52 },
  { name: "Traditional Energy", color: "#f59e0b", pipelineValue: 3950000, deals: 7, winRate: 71 },
  { name: "Automotive Mfg", color: "#22c55e", pipelineValue: 2840000, deals: 6, winRate: 64 },
  { name: "Project Logistics", color: "#f97316", pipelineValue: 2100000, deals: 5, winRate: 59 },
  { name: "MedTech & Pharma", color: "#ec4899", pipelineValue: 1650000, deals: 4, winRate: 73 },
];

export const demoReps: SalesRep[] = [
  { name: "Russ Langley", role: "Sr. Sales", pipeline: 4200000, activities: 47, staleDays: 0, quota: 85 },
  { name: "Ella Fang", role: "NAM Sales", pipeline: 3100000, activities: 38, staleDays: 2, quota: 72 },
  { name: "Quinn Redman", role: "NAM Sales", pipeline: 2800000, activities: 31, staleDays: 5, quota: 61 },
  { name: "Rep 4 (Open)", role: "Hiring", pipeline: 0, activities: 0, staleDays: 0, quota: 0 },
];

export const demoAlerts: SalesAlert[] = [
  { type: "danger", text: "ProtecPV quote expires in 48 hours — no follow-up logged in Copper", source: "Copper + Wrike" },
  { type: "warning", text: "Silfab Solar — 3 open Wrike tasks overdue, blocking Q2 volume commitment", source: "Wrike" },
  { type: "info", text: "Iron Mountain / Brett Spector opened proposal email 4x in last 24hrs — no call scheduled", source: "Copper + Gmail" },
  { type: "success", text: "AmeriPouch ocean booking confirmed — auto-moved to Active in pipeline", source: "Copper + Slack" },
];

export const demoPipelineStages: PipelineStage[] = [
  { name: "Prospecting", count: 12, value: 3200000, color: "#64748b", avgDays: 5 },
  { name: "Discovery", count: 8, value: 5400000, color: "#06b6d4", avgDays: 8 },
  { name: "Proposal", count: 6, value: 7800000, color: "#8b5cf6", avgDays: 12 },
  { name: "Negotiation", count: 4, value: 4100000, color: "#f59e0b", avgDays: 7 },
  { name: "Closing", count: 3, value: 2650000, color: "#22c55e", avgDays: 4 },
];

export const demoVelocityTrends: VelocityTrend[] = [
  { stage: "Prospecting → Discovery", days: 5, prevDays: 7, color: "#06b6d4" },
  { stage: "Discovery → Proposal", days: 8, prevDays: 10, color: "#8b5cf6" },
  { stage: "Proposal → Negotiation", days: 12, prevDays: 11, color: "#f59e0b" },
  { stage: "Negotiation → Close", days: 7, prevDays: 9, color: "#22c55e" },
];

export const demoForecast: ForecastScenario[] = [
  { label: "Committed", value: 3800000, pct: 69, color: "#22c55e" },
  { label: "Best Case", value: 5200000, pct: 95, color: "#b4c5ff" },
  { label: "Stretch", value: 6100000, pct: 111, color: "#8b5cf6" },
];

// Heatmap data: 4 channels x 7 days (Mon-Sun)
export const demoActivityHeatmap = {
  channels: ["Calls", "Emails", "Slack", "Meetings"],
  days: ["M", "T", "W", "T", "F", "S", "S"],
  data: [
    [4, 6, 8, 3, 7, 1, 0],   // Calls
    [12, 15, 9, 14, 11, 2, 1], // Emails
    [3, 5, 7, 4, 6, 0, 0],    // Slack
    [2, 3, 4, 1, 3, 0, 0],    // Meetings
  ],
};

// Aggregate
export const demoSalesKPIs = {
  weightedPipeline: 23150000,
  avgDaysToClose: 34,
  activityToCloseRatio: "6.2:1",
  revenueAtRisk: 1400000,
  annualTarget: 55000000,
  totalCycleDays: 32,
  prevCycleDays: 37,
};
