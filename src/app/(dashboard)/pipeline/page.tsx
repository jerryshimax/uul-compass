import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-current-user";
import {
  getOpportunities,
  getDemandSignals,
  getDemandAggregates,
  getCarrierContracts,
  getPipelineSummary,
} from "@/lib/data/pipeline";
import { PipelineContent } from "./pipeline-content";

/**
 * /pipeline — Sales → Demand → Fulfillment → Carrier Contracts.
 *
 * The commercial loop, end-to-end. Reading scoped by accessibleEntityIds.
 * David: style the content component; this page just loads data.
 */
export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab ?? "sales";

  const entityIds = user.accessibleEntityIds;

  const [summary, opportunities, signals, aggregates, contracts] = await Promise.all([
    getPipelineSummary(entityIds),
    getOpportunities(entityIds),
    getDemandSignals(entityIds),
    getDemandAggregates(entityIds),
    getCarrierContracts(entityIds),
  ]);

  return (
    <PipelineContent
      initialTab={tab}
      summary={summary}
      opportunities={opportunities}
      signals={signals}
      aggregates={aggregates}
      contracts={contracts}
      user={{ id: user.id, fullName: user.fullName, role: user.role }}
    />
  );
}
