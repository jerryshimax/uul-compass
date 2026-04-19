// v2 demo: projects + phases + MW milestones for the hyperscale anchor.
// Other strategic customers get one project each so the Project view has
// substance to render across customers.

export type ProjectStatus = "scoping" | "active" | "on_hold" | "completed" | "cancelled";
export type PhaseStatus = "not_started" | "in_progress" | "at_risk" | "completed" | "blocked";
export type MilestoneType =
  | "delivery"
  | "mw_commissioning"
  | "install_complete"
  | "customs_clear"
  | "phase_gate"
  | "ready_for_install"
  | "other";
export type MilestoneStatus = "upcoming" | "at_risk" | "hit" | "missed" | "blown";

export interface DemoProject {
  id: string;
  customerId: string;
  name: string;
  code?: string;
  description: string;
  status: ProjectStatus;
  totalCapacityMw?: number;
  totalAcres?: number;
  startDate: string;
  targetCompletionDate: string;
  totalContractCents: number;
  recognizedRevenueCents: number;
  marginCents: number;
  leadOps: string;
  leadCommercial: string;
}

export interface DemoProjectPhase {
  id: string;
  projectId: string;
  name: string;
  sequence: number;
  description: string;
  status: PhaseStatus;
  targetMw?: number;
  startDate: string;
  targetCompletionDate: string;
}

export interface DemoProjectMilestone {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  type: MilestoneType;
  targetMw?: number;
  targetDate: string;
  actualDate?: string;
  status: MilestoneStatus;
  daysSlack?: number;
  notes?: string;
}

export const demoProjects: DemoProject[] = [
  {
    id: "proj-hs-phase1",
    customerId: "cust-hyperscale-aidc",
    name: "Hyperscale AIDC — Phase I (1,935 MW)",
    code: "AIDC-HS-1",
    description:
      "Phase I of the 8.07 GW dual-campus build. 18-month delivery, Sep 2026 → Jan 2028. " +
      "1,290 reciprocating gensets + 180+ BESS loads + 45+ transformer/switchgear units + " +
      "800+ SCR systems + 1,800+ TEU IT/cooling + 1,200+ TEU EU/Asia components.",
    status: "active",
    totalCapacityMw: 1935,
    totalAcres: 2380,
    startDate: "2026-09-01",
    targetCompletionDate: "2028-01-31",
    totalContractCents: 28_500_000_00,
    recognizedRevenueCents: 4_280_000_00,
    marginCents: 642_000_00,
    leadOps: "Marco",
    leadCommercial: "Russ Langley",
  },
  {
    id: "proj-silfab-2026",
    customerId: "cust-silfab",
    name: "Silfab — 2026 Annual Program",
    description: "Solar panel imports Asia → NA, ~6,400 TEU annual run-rate.",
    status: "active",
    startDate: "2026-01-01",
    targetCompletionDate: "2026-12-31",
    totalContractCents: 7_200_000_00,
    recognizedRevenueCents: 2_140_000_00,
    marginCents: 184_000_00,
    leadOps: "Marco",
    leadCommercial: "Ella Fang",
  },
  {
    id: "proj-aurora-q2",
    customerId: "cust-aurora-ev",
    name: "Aurora EV — Q2 2026 PO Cohort",
    description: "EV component PO bundle, 240 TEU, Shanghai → Long Beach → Detroit.",
    status: "active",
    startDate: "2026-04-01",
    targetCompletionDate: "2026-06-30",
    totalContractCents: 980_000_00,
    recognizedRevenueCents: 320_000_00,
    marginCents: 48_000_00,
    leadOps: "Marco",
    leadCommercial: "Quinn Redman",
  },
  {
    id: "proj-northwind-2026",
    customerId: "cust-northwind-grid",
    name: "Northwind Grid Storage — 2026 Deployments",
    description: "Utility-scale BESS deployments, Class 9 DG, climate-controlled staging.",
    status: "active",
    startDate: "2026-01-01",
    targetCompletionDate: "2026-12-31",
    totalContractCents: 5_400_000_00,
    recognizedRevenueCents: 1_680_000_00,
    marginCents: 84_000_00,
    leadOps: "Alic Ge",
    leadCommercial: "Russ Langley",
  },
];

export const demoProjectPhases: DemoProjectPhase[] = [
  // Hyperscale Phase I sub-phases (the 5 power-ramp tranches)
  {
    id: "phase-hs1-a",
    projectId: "proj-hs-phase1",
    name: "Tranche A — 135 MW",
    sequence: 1,
    description: "First power pad node energization. 90 gensets + 8 BESS + 3 transformers.",
    status: "in_progress",
    targetMw: 135,
    startDate: "2026-09-01",
    targetCompletionDate: "2027-01-15",
  },
  {
    id: "phase-hs1-b",
    projectId: "proj-hs-phase1",
    name: "Tranche B — 675 MW",
    sequence: 2,
    description: "Pads 2-4 energization. 360 gensets + 32 BESS + 12 transformers.",
    status: "not_started",
    targetMw: 675,
    startDate: "2027-01-15",
    targetCompletionDate: "2027-05-30",
  },
  {
    id: "phase-hs1-c",
    projectId: "proj-hs-phase1",
    name: "Tranche C — 1,215 MW",
    sequence: 3,
    description: "Pads 5-7 energization. 360 gensets + 48 BESS + 12 transformers.",
    status: "not_started",
    targetMw: 1215,
    startDate: "2027-05-30",
    targetCompletionDate: "2027-09-15",
  },
  {
    id: "phase-hs1-d",
    projectId: "proj-hs-phase1",
    name: "Tranche D — 1,755 MW",
    sequence: 4,
    description: "Pads 8-10 energization. 360 gensets + 60 BESS + 12 transformers.",
    status: "not_started",
    targetMw: 1755,
    startDate: "2027-09-15",
    targetCompletionDate: "2027-11-30",
  },
  {
    id: "phase-hs1-e",
    projectId: "proj-hs-phase1",
    name: "Tranche E — 1,935 MW (Phase I complete)",
    sequence: 5,
    description: "Pad 11 + final commissioning. 120 gensets + 32 BESS + 6 transformers.",
    status: "not_started",
    targetMw: 1935,
    startDate: "2027-11-30",
    targetCompletionDate: "2028-01-31",
  },
];

export const demoProjectMilestones: DemoProjectMilestone[] = [
  // Hyperscale MW commissioning ticks (the master schedule spine)
  {
    id: "ms-hs1-mw135",
    projectId: "proj-hs-phase1",
    phaseId: "phase-hs1-a",
    name: "135 MW commissioned",
    type: "mw_commissioning",
    targetMw: 135,
    targetDate: "2027-01-15",
    status: "at_risk",
    daysSlack: 12,
    notes: "Genset shipment GS-A-018 customs hold (Yantian) — 4-day delay risk. Escalated to Marco.",
  },
  {
    id: "ms-hs1-mw675",
    projectId: "proj-hs-phase1",
    phaseId: "phase-hs1-b",
    name: "675 MW commissioned",
    type: "mw_commissioning",
    targetMw: 675,
    targetDate: "2027-05-30",
    status: "upcoming",
    daysSlack: 47,
  },
  {
    id: "ms-hs1-mw1215",
    projectId: "proj-hs-phase1",
    phaseId: "phase-hs1-c",
    name: "1,215 MW commissioned",
    type: "mw_commissioning",
    targetMw: 1215,
    targetDate: "2027-09-15",
    status: "upcoming",
    daysSlack: 89,
  },
  {
    id: "ms-hs1-mw1755",
    projectId: "proj-hs-phase1",
    phaseId: "phase-hs1-d",
    name: "1,755 MW commissioned",
    type: "mw_commissioning",
    targetMw: 1755,
    targetDate: "2027-11-30",
    status: "upcoming",
    daysSlack: 124,
  },
  {
    id: "ms-hs1-mw1935",
    projectId: "proj-hs-phase1",
    phaseId: "phase-hs1-e",
    name: "1,935 MW — Phase I complete",
    type: "mw_commissioning",
    targetMw: 1935,
    targetDate: "2028-01-31",
    status: "upcoming",
    daysSlack: 156,
  },
  // Silfab milestone
  {
    id: "ms-silfab-q2",
    projectId: "proj-silfab-2026",
    name: "Q2 panel cohort delivered",
    type: "delivery",
    targetDate: "2026-06-30",
    status: "upcoming",
    daysSlack: 22,
  },
  // Aurora milestone
  {
    id: "ms-aurora-q2",
    projectId: "proj-aurora-q2",
    name: "Q2 PO cohort delivered to Detroit plant",
    type: "delivery",
    targetDate: "2026-06-30",
    status: "upcoming",
    daysSlack: 18,
  },
  // Northwind milestones
  {
    id: "ms-northwind-may",
    projectId: "proj-northwind-2026",
    name: "May BESS deployment installed",
    type: "install_complete",
    targetDate: "2026-05-30",
    status: "upcoming",
    daysSlack: 9,
  },
];

export function getProject(id: string): DemoProject | undefined {
  return demoProjects.find((p) => p.id === id);
}

export function getProjectsByCustomer(customerId: string): DemoProject[] {
  return demoProjects.filter((p) => p.customerId === customerId);
}

export function getPhasesByProject(projectId: string): DemoProjectPhase[] {
  return demoProjectPhases.filter((p) => p.projectId === projectId);
}

export function getMilestonesByProject(projectId: string): DemoProjectMilestone[] {
  return demoProjectMilestones
    .filter((m) => m.projectId === projectId)
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}
