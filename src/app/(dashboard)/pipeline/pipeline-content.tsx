"use client";

import { useState } from "react";
import type {
  OpportunityListItem,
  DemandSignalListItem,
  DemandAggregate,
  CarrierContractListItem,
  PipelineSummary,
} from "@/lib/data/pipeline";

type Tab = "sales" | "demand" | "fulfillment" | "contracts";

type Props = {
  initialTab: string;
  summary: PipelineSummary;
  opportunities: OpportunityListItem[];
  signals: DemandSignalListItem[];
  aggregates: DemandAggregate[];
  contracts: CarrierContractListItem[];
  user: { id: string; fullName: string; role: string };
};

/**
 * SCAFFOLD — minimal tab structure + data rendering.
 * David: style this with the existing Compass visual language.
 * Tailwind classes are placeholders; use slate/blue tokens from other pages.
 */
export function PipelineContent({
  initialTab,
  summary,
  opportunities,
  signals,
  aggregates,
  contracts,
}: Props) {
  const [tab, setTab] = useState<Tab>(
    (["sales", "demand", "fulfillment", "contracts"] as Tab[]).includes(initialTab as Tab)
      ? (initialTab as Tab)
      : "sales",
  );

  const TABS: { key: Tab; label: string; labelZh: string }[] = [
    { key: "sales", label: "Sales", labelZh: "销售" },
    { key: "demand", label: "Demand", labelZh: "需求" },
    { key: "fulfillment", label: "Fulfillment", labelZh: "履约" },
    { key: "contracts", label: "Carrier Contracts", labelZh: "承运合同" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* ─── Header ─── */}
      <header className="mb-8">
        <h1 className="font-serif text-3xl text-blue-100 mb-2">Pipeline</h1>
        <p className="text-sm text-slate-500">
          Sales opportunities, forward-looking demand, fulfillment status, and carrier
          contract utilization — the commercial loop end to end.
        </p>
      </header>

      {/* ─── Summary cards ─── */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Open Opportunities"
          value={summary.openOpportunities.toString()}
          sublabel={`$${Math.round(summary.expectedValueCents / 100 / 1_000_000).toLocaleString()}M expected`}
        />
        <SummaryCard
          label="Demand Signals (90d)"
          value={summary.demandSignalsNext90Days.toString()}
          sublabel={`${summary.demandTeuNext90Days.toLocaleString()} TEU`}
        />
        <SummaryCard
          label="Contracts ≥80% Utilized"
          value={summary.contractsAtRisk.toString()}
          sublabel={summary.contractsAtRisk > 0 ? "Procurement action needed" : "All healthy"}
          warning={summary.contractsAtRisk > 0}
        />
        <SummaryCard
          label="Your Stage Mix"
          value={Object.keys(summary.opportunitiesByStage).length.toString()}
          sublabel="stages with activity"
        />
      </section>

      {/* ─── Tabs ─── */}
      <nav className="flex gap-1 border-b border-slate-800 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "px-4 py-3 text-blue-200 border-b-2 border-blue-500 font-semibold text-sm"
                : "px-4 py-3 text-slate-500 hover:text-slate-300 text-sm"
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ─── Tab panels ─── */}
      {tab === "sales" && <SalesTab opportunities={opportunities} />}
      {tab === "demand" && <DemandTab signals={signals} aggregates={aggregates} />}
      {tab === "fulfillment" && <FulfillmentTab signals={signals.filter((s) => !s.fulfilled)} />}
      {tab === "contracts" && <ContractsTab contracts={contracts} />}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sublabel,
  warning = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  warning?: boolean;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
      <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className={`font-serif text-3xl mb-1 ${warning ? "text-amber-300" : "text-blue-100"}`}>{value}</p>
      <p className="text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}

// ─── Sales tab ────────────────────────────────────────────────
function SalesTab({ opportunities }: { opportunities: OpportunityListItem[] }) {
  if (opportunities.length === 0) {
    return <EmptyState message="No opportunities yet. Ask Compass to log one from your last customer call." />;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
          <th className="py-3 px-3">Customer</th>
          <th className="py-3 px-3">Stage</th>
          <th className="py-3 px-3">Salesperson</th>
          <th className="py-3 px-3">Lane</th>
          <th className="py-3 px-3 text-right">Volume (TEU)</th>
          <th className="py-3 px-3 text-right">Expected Value</th>
          <th className="py-3 px-3">Close Date</th>
        </tr>
      </thead>
      <tbody>
        {opportunities.map((o) => (
          <tr key={o.id} className="border-b border-slate-900 hover:bg-slate-900/50">
            <td className="py-3 px-3 text-slate-200">{o.customerName}</td>
            <td className="py-3 px-3">
              <StageBadge stage={o.stage} />
            </td>
            <td className="py-3 px-3 text-slate-400">{o.salespersonName ?? "—"}</td>
            <td className="py-3 px-3 text-slate-400">{o.lane ?? "—"}</td>
            <td className="py-3 px-3 text-right text-slate-300">{o.volumeTeu?.toLocaleString() ?? "—"}</td>
            <td className="py-3 px-3 text-right text-slate-300">
              {o.expectedValueCents ? `$${(o.expectedValueCents / 100).toLocaleString()}` : "—"}
            </td>
            <td className="py-3 px-3 text-slate-500">
              {o.expectedCloseDate ? new Date(o.expectedCloseDate).toLocaleDateString() : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Demand tab ───────────────────────────────────────────────
function DemandTab({
  signals,
  aggregates,
}: {
  signals: DemandSignalListItem[];
  aggregates: DemandAggregate[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-semibold text-blue-200 mb-3 uppercase tracking-wider">
          Aggregated by lane × month
        </h3>
        {aggregates.length === 0 ? (
          <EmptyState message="No demand signals logged yet." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="py-3 px-3">Lane</th>
                <th className="py-3 px-3">Month</th>
                <th className="py-3 px-3 text-right">Total TEU</th>
                <th className="py-3 px-3 text-right">Signals</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((a) => (
                <tr key={`${a.lane}-${a.month}`} className="border-b border-slate-900">
                  <td className="py-3 px-3 text-slate-200">{a.lane}</td>
                  <td className="py-3 px-3 text-slate-400">{a.month}</td>
                  <td className="py-3 px-3 text-right text-blue-200 font-semibold">
                    {a.totalTeu.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-500">{a.signalCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-blue-200 mb-3 uppercase tracking-wider">
          Individual signals
        </h3>
        {signals.length === 0 ? (
          <EmptyState message="Salespeople: use the AI button to log prospective deals." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                <th className="py-3 px-3">Lane</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Salesperson</th>
                <th className="py-3 px-3 text-right">TEU</th>
                <th className="py-3 px-3">Start</th>
                <th className="py-3 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((s) => (
                <tr key={s.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                  <td className="py-3 px-3 text-slate-200">{s.lane}</td>
                  <td className="py-3 px-3 text-slate-400">{s.customerName ?? "—"}</td>
                  <td className="py-3 px-3 text-slate-400">{s.salespersonName ?? "—"}</td>
                  <td className="py-3 px-3 text-right text-slate-300">{s.expectedVolumeTeu.toLocaleString()}</td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(s.expectedStartDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <ConfidenceBadge confidence={s.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

// ─── Fulfillment tab ──────────────────────────────────────────
function FulfillmentTab({ signals }: { signals: DemandSignalListItem[] }) {
  if (signals.length === 0) {
    return <EmptyState message="Nothing awaiting fulfillment. New demand signals from sales will appear here." />;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        {signals.length} demand signals pending fulfillment assignment.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <th className="py-3 px-3">Lane</th>
            <th className="py-3 px-3">Customer</th>
            <th className="py-3 px-3">Salesperson</th>
            <th className="py-3 px-3 text-right">TEU</th>
            <th className="py-3 px-3">Start</th>
            <th className="py-3 px-3">Assigned CS</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((s) => (
            <tr key={s.id} className="border-b border-slate-900">
              <td className="py-3 px-3 text-slate-200">{s.lane}</td>
              <td className="py-3 px-3 text-slate-400">{s.customerName ?? "—"}</td>
              <td className="py-3 px-3 text-slate-400">{s.salespersonName ?? "—"}</td>
              <td className="py-3 px-3 text-right text-slate-300">{s.expectedVolumeTeu.toLocaleString()}</td>
              <td className="py-3 px-3 text-slate-500">
                {new Date(s.expectedStartDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-3 text-slate-400">{s.assignedCsName ?? "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Contracts tab ────────────────────────────────────────────
function ContractsTab({ contracts }: { contracts: CarrierContractListItem[] }) {
  if (contracts.length === 0) {
    return <EmptyState message="No carrier contracts tracked. Procurement: log active service contracts to enable utilization alerts." />;
  }

  const highUtil = contracts.filter((c) => c.utilizationPct >= 80);

  return (
    <div className="space-y-6">
      {highUtil.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-amber-300 mb-1">
            ⚠ {highUtil.length} contract{highUtil.length > 1 ? "s" : ""} at 80%+ utilization
          </h3>
          <p className="text-xs text-amber-200/70">
            Procurement should start negotiating MQC additions before peak season.
          </p>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
            <th className="py-3 px-3">Carrier</th>
            <th className="py-3 px-3">Lane</th>
            <th className="py-3 px-3">Contract Code</th>
            <th className="py-3 px-3">Validity</th>
            <th className="py-3 px-3 text-right">MQC</th>
            <th className="py-3 px-3">Utilization</th>
            <th className="py-3 px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id} className="border-b border-slate-900 hover:bg-slate-900/50">
              <td className="py-3 px-3 text-slate-200">{c.carrierName}</td>
              <td className="py-3 px-3 text-slate-400">{c.lane}</td>
              <td className="py-3 px-3 text-slate-500 text-xs">{c.contractCode ?? "—"}</td>
              <td className="py-3 px-3 text-slate-500 text-xs">
                {new Date(c.validityStart).toLocaleDateString()} →{" "}
                {new Date(c.validityEnd).toLocaleDateString()}
              </td>
              <td className="py-3 px-3 text-right text-slate-300">
                {c.mqcUtilized.toLocaleString()} / {c.mqcCommitted.toLocaleString()}
              </td>
              <td className="py-3 px-3">
                <UtilizationBar pct={c.utilizationPct} />
              </td>
              <td className="py-3 px-3">
                <StatusBadge status={c.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Shared bits ──────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-slate-500 text-sm">{message}</div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const color =
    stage === "won"
      ? "bg-green-900/30 text-green-300 border-green-800"
      : stage === "lost"
        ? "bg-slate-900 text-slate-500 border-slate-800"
        : stage === "negotiating"
          ? "bg-amber-900/30 text-amber-300 border-amber-800"
          : "bg-blue-900/30 text-blue-200 border-blue-800";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider border ${color}`}>
      {stage}
    </span>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const color =
    confidence === "high"
      ? "text-green-300"
      : confidence === "medium"
        ? "text-amber-300"
        : "text-slate-400";
  return <span className={`text-xs font-semibold uppercase ${color}`}>{confidence}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "active"
      ? "text-green-300"
      : status === "in_negotiation"
        ? "text-blue-300"
        : status === "expired"
          ? "text-slate-500"
          : "text-red-300";
  return <span className={`text-xs font-semibold uppercase ${color}`}>{status.replace("_", " ")}</span>;
}

function UtilizationBar({ pct }: { pct: number }) {
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : pct >= 50 ? "bg-blue-500" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-slate-400 min-w-[3rem]">{pct}%</span>
    </div>
  );
}
