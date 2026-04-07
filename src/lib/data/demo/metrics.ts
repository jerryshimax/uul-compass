import type { MetricData, PillarMetric, FinancialPulseMetric } from "../types";

// Financial Pulse — compact cash/AR/working capital snapshot for dashboard
export const demoFinancialPulse: FinancialPulseMetric[] = [
  { id: "fp-cash", label: "Cash Position", value: "$2.1M", subLabel: "Across 4 entities", trend: "down", status: "amber" },
  { id: "fp-ar", label: "AR Outstanding", value: "$1.8M", subLabel: "Silfab $1.2M (pp/cc, 90+ day cycle)", trend: "flat", status: "red" },
  { id: "fp-wc", label: "Capital Fronted", value: "~3 mo", subLabel: "30+60+30 day AR cycle", status: "red" },
  { id: "fp-value", label: "Value Captured", value: "$0", subLabel: "$1.9M target", trend: "flat", status: "gray" },
];

// 6-Pillar Scorecard for Dashboard
export const demoPillarScorecard: PillarMetric[] = [
  {
    id: "pillar-finance",
    pillar: "finance",
    name: "Finance Transformation",
    icon: "account_balance",
    overallStatus: "red",
    headline: "1 / 4",
    headlineLabel: "entities consolidated",
    subItems: [
      { label: "Consolidated Reporting", value: "1 / 4 entities", status: "red" },
      { label: "AR Financing Setup", value: "In progress", status: "amber" },
      { label: "Forecasting & AI Adoption", value: "Not started", status: "gray" },
    ],
  },
  {
    id: "pillar-vendor-ops",
    pillar: "vendor_ops",
    name: "Vendor & Operations",
    icon: "local_shipping",
    overallStatus: "amber",
    headline: "0 / 5",
    headlineLabel: "carrier contracts renewed",
    subItems: [
      { label: "Carrier Contract Negotiations", value: "In progress", status: "amber" },
      { label: "Pricing & Quoting (Pallet.AI)", value: "In progress", status: "amber" },
      { label: "Cross-Office Process Mapping", value: "15%", status: "red" },
    ],
  },
  {
    id: "pillar-org-incentives",
    pillar: "org_incentives",
    name: "Org & Incentives",
    icon: "handshake",
    overallStatus: "amber",
    headline: "2 / 6",
    headlineLabel: "structures defined",
    subItems: [
      { label: "Updating Executive Comp", value: "In progress", status: "amber" },
      { label: "Cross-Entity Incentive Framework", value: "Drafting", status: "amber" },
      { label: "Entity Working Agreements", value: "Not started", status: "gray" },
    ],
  },
  {
    id: "pillar-brand-marketing",
    pillar: "brand_marketing",
    name: "Brand & Marketing",
    icon: "campaign",
    overallStatus: "amber",
    headline: "In progress",
    headlineLabel: "AI-first rebrand",
    subItems: [
      { label: "AI-First Brand Narrative", value: "In progress", status: "amber" },
      { label: "Corporate Deck Update", value: "In progress", status: "amber" },
      { label: "Market Awareness Campaign", value: "Not started", status: "gray" },
    ],
  },
  {
    id: "pillar-regional-expansion",
    pillar: "regional_expansion",
    name: "Regional Expansion",
    icon: "public",
    overallStatus: "amber",
    headline: "0 / 4",
    headlineLabel: "new offices launched",
    subItems: [
      { label: "Mexico", value: "Planning", status: "amber" },
      { label: "Indonesia & Malaysia", value: "Planning", status: "amber" },
      { label: "Nordic Europe", value: "Planning", status: "amber" },
    ],
  },
  {
    id: "pillar-sales-intel",
    pillar: "sales_intel",
    name: "Sales Intelligence",
    icon: "monitoring",
    overallStatus: "gray",
    headline: "0%",
    headlineLabel: "CRM coverage",
    subItems: [
      { label: "Sales Velocity Tracking", value: "Not started", status: "gray" },
      { label: "Salesperson KPIs (New vs Old)", value: "Not started", status: "gray" },
      { label: "Pipeline & Industry Breakdown", value: "Not started", status: "gray" },
    ],
  },
];

// Legacy flat scorecard (kept for extended KPI page)
export const demoScorecard: MetricData[] = [
  { id: "metric-financial-vis", name: "Financial Visibility", value: "1 / 4", target: "4 entities reporting", status: "red", trend: "up", category: "financial" },
  { id: "metric-process-map", name: "Process Mapping", value: "15%", target: "100% core workflows", status: "red", trend: "up", category: "operations" },
  { id: "metric-org-alignment", name: "Org Alignment", value: "3 / 8", target: "Key roles confirmed", status: "amber", trend: "up", category: "people" },
  { id: "metric-customer-cont", name: "Customer Continuity", value: "4 / 20", target: "Top 20 contacted", status: "amber", trend: "up", category: "operations" },
];

// Extended metrics for potential future KPI page
export const demoAllMetrics: MetricData[] = [
  ...demoScorecard,
  { id: "metric-gm", name: "Gross Margin", value: "22%", target: "15-30%", status: "green", category: "financial" },
  { id: "metric-ebitda", name: "Profit Margin", value: "9%", target: "8-15%", status: "green", category: "financial" },
  { id: "metric-otif", name: "On-Time Delivery", value: "93%", target: "> 95%", status: "amber", category: "operations" },
  { id: "metric-retention", name: "Customer Retention", value: "96%", target: "> 90%", status: "green", category: "operations" },
  { id: "metric-volume", name: "Shipment Volume", value: "1,240", target: "Track MoM", status: "green", trend: "up", category: "operations" },
  { id: "metric-newcust", name: "New Customers", value: "3", target: "Monthly pipeline", status: "green", trend: "up", category: "operations" },
  { id: "metric-winrate", name: "RFP Win Rate", value: "28%", target: "> 30%", status: "amber", category: "operations" },
  { id: "metric-headcount", name: "Net Headcount", value: "0", target: "Flat or reduced", status: "green", category: "people" },
];
