import { pgEnum } from "drizzle-orm/pg-core";

// ─── Organization ───────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "board",
  "advisor",
  "executive",
  "department_head",
  "manager",
  "operator",
  "sales",
  "customer_service",
  "procurement",
  "operations",
  "finance",
  "compliance",
  "viewer",
]);

export const contactTypeEnum = pgEnum("contact_type", [
  "customer",
  "carrier",
  "partner",
  "advisor",
  "vendor",
  "customs_broker",
  "agent",
  "other",
]);

// ─── Customer & CRM ────────────────────────────────────────────
export const industryEnum = pgEnum("industry", [
  "ai_infrastructure",
  "renewable_energy",
  "advanced_manufacturing",
  "automotive",
  "electronics",
  "consumer_goods",
  "pharma",
  "chemicals",
  "agriculture",
  "construction",
  "food_beverage",
  "other",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "prospect",
  "active",
  "inactive",
  "suspended",
  "churned",
]);

export const pipelineStageEnum = pgEnum("pipeline_stage", [
  "prospect",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);

// ─── Carrier ────────────────────────────────────────────────────
export const carrierTypeEnum = pgEnum("carrier_type", [
  "ocean",
  "air",
  "trucking",
  "drayage",
  "rail",
  "nvocc",
  "courier",
  "multi_modal",
]);

export const contractStatusEnum = pgEnum("contract_status", [
  "draft",
  "active",
  "expired",
  "terminated",
]);

// ─── Transport ──────────────────────────────────────────────────
export const transportModeEnum = pgEnum("transport_mode", [
  "ocean_fcl",
  "ocean_lcl",
  "air",
  "trucking_ftl",
  "trucking_ltl",
  "drayage",
  "rail",
  "courier",
  "multi_modal",
]);

export const containerTypeEnum = pgEnum("container_type", [
  "20GP",
  "40GP",
  "40HC",
  "45HC",
  "20RF",
  "40RF",
  "20OT",
  "40OT",
  "20FR",
  "40FR",
  "20TK",
  "LCL",
]);

export const rateUnitEnum = pgEnum("rate_unit", [
  "per_container",
  "per_cbm",
  "per_kg",
  "per_cwt",
  "per_mile",
  "per_shipment",
  "flat",
  "per_pallet",
]);

export const chargeCategoryEnum = pgEnum("charge_category", [
  "origin",
  "freight",
  "destination",
  "customs",
  "insurance",
  "trucking",
  "warehousing",
  "other",
]);

// ─── Quotation ──────────────────────────────────────────────────
export const incotermEnum = pgEnum("incoterm", [
  "EXW",
  "FCA",
  "FAS",
  "FOB",
  "CFR",
  "CIF",
  "CPT",
  "CIP",
  "DAP",
  "DPU",
  "DDP",
]);

export const rfqStatusEnum = pgEnum("rfq_status", [
  "received",
  "in_progress",
  "quoted",
  "expired",
  "cancelled",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "superseded",
]);

// ─── Shipment ───────────────────────────────────────────────────
export const directionEnum = pgEnum("direction", [
  "import",
  "export",
  "domestic",
  "cross_trade",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "draft",
  "booked",
  "confirmed",
  "in_transit_origin",
  "at_origin_port",
  "departed",
  "in_transit",
  "arrived",
  "customs_hold",
  "customs_cleared",
  "in_delivery",
  "delivered",
  "completed",
  "cancelled",
  "on_hold",
]);

export const blTypeEnum = pgEnum("bl_type", [
  "original",
  "telex_release",
  "seaway_bill",
  "express",
]);

export const exceptionTypeEnum = pgEnum("exception_type", [
  "delay",
  "customs_hold",
  "damage",
  "shortage",
  "documentation",
  "carrier_issue",
  "weather",
  "port_congestion",
  "demurrage",
  "detention",
  "other",
]);

// ─── Finance ────────────────────────────────────────────────────
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "void",
  "disputed",
]);

// ─── Customs ────────────────────────────────────────────────────
export const customsStatusEnum = pgEnum("customs_status", [
  "pending",
  "filed",
  "under_review",
  "hold",
  "cleared",
  "liquidated",
  "protest",
]);

// ─── Documents ──────────────────────────────────────────────────
export const documentTypeEnum = pgEnum("document_type", [
  "bill_of_lading",
  "airway_bill",
  "commercial_invoice",
  "packing_list",
  "certificate_of_origin",
  "customs_entry",
  "isf",
  "arrival_notice",
  "delivery_order",
  "pod",
  "cargo_insurance",
  "letter_of_credit",
  "booking_confirmation",
  "carrier_invoice",
  "contract",
  "sop",
  "rate_sheet",
  "correspondence",
  "photo",
  "other",
]);

// ─── PMI ────────────────────────────────────────────────────────
export const pmiStatusEnum = pgEnum("pmi_status", [
  "not_started",
  "in_progress",
  "at_risk",
  "completed",
  "blocked",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "blocked",
  "review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "critical",
  "high",
  "medium",
  "low",
]);

// ─── Action Items ───────────────────────────────────────────────
export const actionItemStatusEnum = pgEnum("action_item_status", [
  "open",
  "done",
  "overdue",
  "cancelled",
]);

// ─── Phases & Gates ────────────────────────────────────────────
export const phaseStatusEnum = pgEnum("phase_status", [
  "not_started",
  "active",
  "completed",
]);

export const gateStatusEnum = pgEnum("gate_status", [
  "upcoming",
  "ready",
  "passed",
  "failed",
  "deferred",
]);

// ─── Access Control ────────────────────────────────────────────
export const accessLevelEnum = pgEnum("access_level", [
  "full",
  "read",
  "restricted",
]);

// ─── Value Gains ───────────────────────────────────────────────
export const valueCategoryEnum = pgEnum("value_category", [
  "cost_savings",
  "revenue_growth",
  "cash_flow",
]);

export const valueStatusEnum = pgEnum("value_status", [
  "planned",
  "in_progress",
  "capturing",
  "captured",
]);

// ─── Growth Priorities ─────────────────────────────────────────
export const growthPriorityStatusEnum = pgEnum("growth_priority_status", [
  "active",
  "planned",
]);

// ─── Risks ─────────────────────────────────────────────────────
export const riskSeverityEnum = pgEnum("risk_severity", [
  "high",
  "medium",
  "low",
]);

export const riskStatusEnum = pgEnum("risk_status", [
  "open",
  "mitigating",
  "resolved",
]);

// ─── AI ─────────────────────────────────────────────────────────
export const aiMessageRoleEnum = pgEnum("ai_message_role", [
  "system",
  "user",
  "assistant",
  "tool",
]);

export const aiToolStatusEnum = pgEnum("ai_tool_status", [
  "pending",
  "confirmed",
  "rejected",
  "executed",
  "failed",
]);

// Vercel AI Gateway model slugs ("provider/model" with dots for versions)
export const aiModelEnum = pgEnum("ai_model", [
  "anthropic/claude-opus-4.6",
  "anthropic/claude-sonnet-4.6",
  "anthropic/claude-haiku-4.5",
  "openai/gpt-5.4",
  "openai/gpt-5.4-pro",
  "openai/text-embedding-3-small",
]);

// ─── Cross-Border Workflows ────────────────────────────────────
export const handoffStatusEnum = pgEnum("handoff_status", [
  "sent",
  "seen",
  "acknowledged",
  "in_progress",
  "completed",
  "declined",
  "cancelled",
]);

export const handoffUrgencyEnum = pgEnum("handoff_urgency", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const watchTypeEnum = pgEnum("watch_type", [
  "any_change",
  "major_only",
  "mentions_only",
]);

export const notificationKindEnum = pgEnum("notification_kind", [
  "handoff_received",
  "handoff_status_changed",
  "mention",
  "watch_alert",
  "ai_insight",
  "system",
]);

// ─── Sales Pipeline ────────────────────────────────────────────
export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "lead",
  "qualified",
  "quoted",
  "negotiating",
  "won",
  "lost",
]);

export const demandConfidenceEnum = pgEnum("demand_confidence", [
  "low",
  "medium",
  "high",
]);

// ─── Carrier Contracts ─────────────────────────────────────────
export const carrierContractStatusEnum = pgEnum("carrier_contract_status", [
  "in_negotiation",
  "active",
  "expired",
  "terminated",
]);

// ─── Feedback ──────────────────────────────────────────────────
export const feedbackTypeEnum = pgEnum("feedback_type", [
  "bug",
  "idea",
  "question",
  "praise",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "open",
  "triaged",
  "in_progress",
  "resolved",
  "wont_fix",
]);
