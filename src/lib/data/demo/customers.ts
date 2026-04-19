// v2 demo: 5 customers spanning UUL's lead verticals.
// Hyperscale anchor case = the deck's 8.07 GW AI data center.

export type CustomerStatus = "prospect" | "active" | "inactive" | "suspended" | "churned";
export type Vertical =
  | "ai_infrastructure"
  | "renewable_energy"
  | "advanced_manufacturing"
  | "automotive"
  | "construction"
  | "consumer_goods";

export interface DemoCustomer {
  id: string;
  name: string;
  legalName?: string;
  publicBrand: "UUL Global Warehousing" | "Sage Line Logistics" | "All Points Customs";
  vertical: Vertical;
  status: CustomerStatus;
  isStrategic: boolean;
  accountOwner: string;
  strategicNotes: string;
  revenueYtdCents: number;
  revenueLtmCents: number;
  openArCents: number;
  marginYtdCents: number;
  lastTouchAt: string; // ISO date
}

export const demoCustomers: DemoCustomer[] = [
  {
    id: "cust-hyperscale-aidc",
    name: "Hyperscale AIDC Campus",
    legalName: "Hyperscale Holdings LLC",
    publicBrand: "UUL Global Warehousing",
    vertical: "ai_infrastructure",
    status: "active",
    isStrategic: true,
    accountOwner: "Russ Langley",
    strategicNotes:
      "Anchor AIDC engagement. 8.07 GW total capacity, dual-campus, 4 phases over 5 years. " +
      "Tri-modal access (rail + inland port + interstate). EPC: Bechtel; BESS supplier: Tesla; " +
      "Owner's engineer: Black & Veatch. UUL is sole logistics partner Phase I, RFP for Phase II " +
      "expected Q4 2026. Critical to deliver on MW commissioning milestones — late equipment = " +
      "delayed revenue for the customer = relationship at risk.",
    revenueYtdCents: 4_280_000_00,
    revenueLtmCents: 8_120_000_00,
    openArCents: 1_650_000_00,
    marginYtdCents: 642_000_00,
    lastTouchAt: "2026-04-17T14:30:00Z",
  },
  {
    id: "cust-silfab",
    name: "Silfab Solar",
    legalName: "Silfab Solar Inc.",
    publicBrand: "UUL Global Warehousing",
    vertical: "renewable_energy",
    status: "active",
    isStrategic: true,
    accountOwner: "Ella Fang",
    strategicNotes:
      "Largest renewable customer. Solar panels via Asia → NA. AR collection is the active " +
      "battle (Task F1 in PMI plan). 30% prepayment ask is on the table. Relationship strong " +
      "but cash terms need to tighten.",
    revenueYtdCents: 2_140_000_00,
    revenueLtmCents: 6_840_000_00,
    openArCents: 980_000_00,
    marginYtdCents: 184_000_00,
    lastTouchAt: "2026-04-15T09:00:00Z",
  },
  {
    id: "cust-aurora-ev",
    name: "Aurora EV",
    publicBrand: "Sage Line Logistics",
    vertical: "automotive",
    status: "active",
    isStrategic: false,
    accountOwner: "Quinn Redman",
    strategicNotes:
      "EV components and tooling Asia → NA. PO management is the priority surface for them; " +
      "no MW milestones, just delivery dates against production schedule.",
    revenueYtdCents: 920_000_00,
    revenueLtmCents: 2_310_000_00,
    openArCents: 245_000_00,
    marginYtdCents: 138_000_00,
    lastTouchAt: "2026-04-12T11:20:00Z",
  },
  {
    id: "cust-northwind-grid",
    name: "Northwind Grid Storage",
    publicBrand: "UUL Global Warehousing",
    vertical: "renewable_energy",
    status: "active",
    isStrategic: true,
    accountOwner: "Russ Langley",
    strategicNotes:
      "Utility-scale BESS deployments. Class 9 DG handling required on every shipment. Margin " +
      "is the weakest of the strategic accounts — needs pricing review at next QBR.",
    revenueYtdCents: 1_680_000_00,
    revenueLtmCents: 4_120_000_00,
    openArCents: 412_000_00,
    marginYtdCents: 84_000_00,
    lastTouchAt: "2026-04-10T16:00:00Z",
  },
  {
    id: "cust-meridian-defense",
    name: "Meridian Defense Systems",
    publicBrand: "All Points Customs",
    vertical: "advanced_manufacturing",
    status: "prospect",
    isStrategic: false,
    accountOwner: "Quinn Redman",
    strategicNotes:
      "Cleared-team requirement. RFQ in flight for Q3 program. Compliance-heavy (ITAR-adjacent); " +
      "All Points Customs is the natural lead brand.",
    revenueYtdCents: 0,
    revenueLtmCents: 0,
    openArCents: 0,
    marginYtdCents: 0,
    lastTouchAt: "2026-04-09T13:45:00Z",
  },
];

export function getCustomer(id: string): DemoCustomer | undefined {
  return demoCustomers.find((c) => c.id === id);
}
