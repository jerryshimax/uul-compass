/**
 * Pipeline data layer — Sales × Demand × Fulfillment × Carrier Contracts.
 *
 * All queries scope by the user's accessibleEntityIds (passed in) so pages
 * only surface data within the user's entity access. This is application-layer
 * enforcement of the RLS-ready contract (see getCurrentUser).
 */

import { cache } from "react";
import { db } from "@/db";
import {
  opportunities,
  opportunityActivities,
  demandSignals,
  carrierContracts,
  users,
} from "@/db/schema";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";

export type OpportunityListItem = {
  id: string;
  customerName: string;
  stage: string;
  salespersonName: string | null;
  lane: string | null;
  volumeTeu: number | null;
  expectedValueCents: number | null;
  expectedCloseDate: Date | null;
  stageChangedAt: Date;
  createdAt: Date;
};

export type DemandSignalListItem = {
  id: string;
  lane: string;
  commodity: string | null;
  customerName: string | null;
  salespersonName: string | null;
  expectedVolumeTeu: number;
  expectedStartDate: Date;
  confidence: string;
  fulfilled: boolean;
  assignedCsName: string | null;
  createdAt: Date;
};

export type CarrierContractListItem = {
  id: string;
  carrierName: string;
  contractCode: string | null;
  lane: string;
  validityStart: Date;
  validityEnd: Date;
  mqcCommitted: number;
  mqcUtilized: number;
  utilizationPct: number;
  status: string;
  peakSeasonTerms: string | null;
};

// ─── Opportunities ─────────────────────────────────────────────
export const getOpportunities = cache(
  async (accessibleEntityIds: string[]): Promise<OpportunityListItem[]> => {
    if (accessibleEntityIds.length === 0) return [];

    const rows = await db
      .select({
        id: opportunities.id,
        customerName: opportunities.customerName,
        stage: opportunities.stage,
        salespersonName: users.fullName,
        lane: opportunities.lane,
        volumeTeu: opportunities.volumeTeu,
        expectedValueCents: opportunities.expectedValueCents,
        expectedCloseDate: opportunities.expectedCloseDate,
        stageChangedAt: opportunities.stageChangedAt,
        createdAt: opportunities.createdAt,
      })
      .from(opportunities)
      .leftJoin(users, eq(users.id, opportunities.salespersonId))
      .where(
        and(
          inArray(opportunities.entityId, accessibleEntityIds),
          isNull(opportunities.deletedAt),
        ),
      )
      .orderBy(desc(opportunities.updatedAt));

    return rows;
  },
);

// ─── Demand Signals (aggregated by lane × month) ───────────────
export const getDemandSignals = cache(
  async (accessibleEntityIds: string[]): Promise<DemandSignalListItem[]> => {
    if (accessibleEntityIds.length === 0) return [];

    // Second-level alias for assigned CS user
    const csUsers = users; // drizzle doesn't require a true alias unless self-joining

    const rows = await db
      .select({
        id: demandSignals.id,
        lane: demandSignals.lane,
        commodity: demandSignals.commodity,
        customerName: demandSignals.customerName,
        salespersonName: users.fullName,
        expectedVolumeTeu: demandSignals.expectedVolumeTeu,
        expectedStartDate: demandSignals.expectedStartDate,
        confidence: demandSignals.confidence,
        fulfilled: demandSignals.fulfilled,
        assignedCsName: sql<string | null>`NULL`,
        // For v1 keep assigned CS unresolved — add a second join later
        createdAt: demandSignals.createdAt,
      })
      .from(demandSignals)
      .leftJoin(users, eq(users.id, demandSignals.salespersonId))
      .where(
        and(
          inArray(demandSignals.entityId, accessibleEntityIds),
          isNull(demandSignals.deletedAt),
        ),
      )
      .orderBy(desc(demandSignals.expectedStartDate));

    return rows;
  },
);

export type DemandAggregate = {
  lane: string;
  month: string; // YYYY-MM
  totalTeu: number;
  signalCount: number;
};

export const getDemandAggregates = cache(
  async (accessibleEntityIds: string[]): Promise<DemandAggregate[]> => {
    if (accessibleEntityIds.length === 0) return [];

    const rows = await db
      .select({
        lane: demandSignals.lane,
        month: sql<string>`to_char(${demandSignals.expectedStartDate}, 'YYYY-MM')`,
        totalTeu: sql<number>`SUM(${demandSignals.expectedVolumeTeu})::int`,
        signalCount: sql<number>`COUNT(*)::int`,
      })
      .from(demandSignals)
      .where(
        and(
          inArray(demandSignals.entityId, accessibleEntityIds),
          isNull(demandSignals.deletedAt),
        ),
      )
      .groupBy(
        demandSignals.lane,
        sql`to_char(${demandSignals.expectedStartDate}, 'YYYY-MM')`,
      )
      .orderBy(sql`to_char(${demandSignals.expectedStartDate}, 'YYYY-MM')`);

    return rows;
  },
);

// ─── Carrier Contracts ─────────────────────────────────────────
export const getCarrierContracts = cache(
  async (accessibleEntityIds: string[]): Promise<CarrierContractListItem[]> => {
    if (accessibleEntityIds.length === 0) return [];

    const rows = await db
      .select()
      .from(carrierContracts)
      .where(
        and(
          inArray(carrierContracts.entityId, accessibleEntityIds),
          isNull(carrierContracts.deletedAt),
        ),
      )
      .orderBy(desc(carrierContracts.validityEnd));

    return rows.map((r) => ({
      id: r.id,
      carrierName: r.carrierName,
      contractCode: r.contractCode,
      lane: r.lane,
      validityStart: r.validityStart,
      validityEnd: r.validityEnd,
      mqcCommitted: r.mqcCommitted,
      mqcUtilized: r.mqcUtilized,
      utilizationPct: r.mqcCommitted > 0 ? Math.round((r.mqcUtilized / r.mqcCommitted) * 100) : 0,
      status: r.status,
      peakSeasonTerms: r.peakSeasonTerms,
    }));
  },
);

// ─── Pipeline Summary (top of /pipeline page) ──────────────────
export type PipelineSummary = {
  openOpportunities: number;
  opportunitiesByStage: Record<string, number>;
  expectedValueCents: number;
  demandSignalsNext90Days: number;
  demandTeuNext90Days: number;
  contractsAtRisk: number;
};

export const getPipelineSummary = cache(
  async (accessibleEntityIds: string[]): Promise<PipelineSummary> => {
    if (accessibleEntityIds.length === 0) {
      return {
        openOpportunities: 0,
        opportunitiesByStage: {},
        expectedValueCents: 0,
        demandSignalsNext90Days: 0,
        demandTeuNext90Days: 0,
        contractsAtRisk: 0,
      };
    }

    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const [oppRows, demandRows, contractRows] = await Promise.all([
      db
        .select({
          stage: opportunities.stage,
          count: sql<number>`COUNT(*)::int`,
          value: sql<number>`COALESCE(SUM(${opportunities.expectedValueCents}), 0)::bigint`,
        })
        .from(opportunities)
        .where(
          and(
            inArray(opportunities.entityId, accessibleEntityIds),
            isNull(opportunities.deletedAt),
          ),
        )
        .groupBy(opportunities.stage),
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
          totalTeu: sql<number>`COALESCE(SUM(${demandSignals.expectedVolumeTeu}), 0)::int`,
        })
        .from(demandSignals)
        .where(
          and(
            inArray(demandSignals.entityId, accessibleEntityIds),
            isNull(demandSignals.deletedAt),
            sql`${demandSignals.expectedStartDate} <= ${ninetyDaysFromNow}`,
          ),
        ),
      db
        .select({
          count: sql<number>`COUNT(*)::int`,
        })
        .from(carrierContracts)
        .where(
          and(
            inArray(carrierContracts.entityId, accessibleEntityIds),
            eq(carrierContracts.status, "active"),
            sql`(${carrierContracts.mqcUtilized}::float / NULLIF(${carrierContracts.mqcCommitted}, 0)) >= 0.8`,
          ),
        ),
    ]);

    const opportunitiesByStage: Record<string, number> = {};
    let expectedValueCents = 0;
    let openOpportunities = 0;

    for (const row of oppRows) {
      opportunitiesByStage[row.stage] = row.count;
      if (row.stage !== "won" && row.stage !== "lost") {
        openOpportunities += row.count;
        expectedValueCents += Number(row.value);
      }
    }

    return {
      openOpportunities,
      opportunitiesByStage,
      expectedValueCents,
      demandSignalsNext90Days: demandRows[0]?.count ?? 0,
      demandTeuNext90Days: demandRows[0]?.totalTeu ?? 0,
      contractsAtRisk: contractRows[0]?.count ?? 0,
    };
  },
);
