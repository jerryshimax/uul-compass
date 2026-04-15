"use client";

import type { PersonData } from "@/lib/data";

// ─── Hardcoded leadership data (preserved from settings page) ─────

const BOARD = [
  { name: "Alic Ge", nameZh: "葛成", role: "board", title: "Chairman of the Board", location: "Ningbo", responsibilities: "Overall governance, China operations oversight, carrier relationships, institutional knowledge" },
  { name: "Jerry Shi", nameZh: "施童洲", role: "owner", title: "PE Owner & Board Member", location: "Toronto / Asia", responsibilities: "Strategic direction, capital deployment, AI transformation, fund management" },
  { name: "Billy Cheng", nameZh: "", role: "board", title: "HK CEO & Board Member", location: "Hong Kong", responsibilities: "Hong Kong operations, regional partnerships, board governance" },
  { name: "Season Yu", nameZh: "", role: "advisor", title: "PE Partner, Finance Advisor", location: "Shanghai", responsibilities: "Financial oversight, cross-entity incentive design, PE advisory" },
];

const EXECUTIVES = [
  { name: "Jason Likens", nameZh: "", role: "executive", title: "CEO, US Operations", location: "US", responsibilities: "US P&L, sales leadership, customer relationships, carrier negotiations" },
  { name: "Josh Foster", nameZh: "", role: "executive", title: "COO, US Operations", location: "US", responsibilities: "US operations, logistics execution, process optimization" },
  { name: "Serena Lin", nameZh: "林静", role: "executive", title: "CFO", location: "China", responsibilities: "Financial reporting, AR/AP management, cash flow forecasting, compliance" },
  { name: "David Wu", nameZh: "", role: "team", title: "Engineer", location: "North America", responsibilities: "Compass OS development, Pallet.AI integration, data architecture" },
];

const ENTITIES = [
  {
    name: "UUL Global",
    nameZh: "美航物流集团",
    role: "Global HQ & Profit Center",
    hq: "Greensboro, NC",
    offices: ["US (Greensboro)", "Hong Kong", "Vietnam"],
    keyPeople: "Jason Likens (CEO), Josh Foster (COO)",
    focus: "Global headquarters and profit center. Handles all customer-facing sales for Western Hemisphere clients. Freight forwarding, customs clearance, last-mile delivery. FMC-licensed NVOCC, US Customs Broker.",
  },
  {
    name: "US United Logistics",
    nameZh: "美航",
    role: "Global Operations & Fulfillment",
    hq: "Shenzhen",
    offices: ["Shenzhen", "Shanghai", "Ningbo", "Guangzhou"],
    keyPeople: "Alic Ge (Chairman)",
    focus: "Operations and fulfillment hub. Fulfills ocean carrier bookings, China origin bookings, and origin-to-ocean services. ~50 employees. Holds key carrier relationships (MSC, CMA, Golden Standard).",
  },
  {
    name: "Star Navigation",
    nameZh: "星航",
    role: "Eastern Hemisphere Sales",
    hq: "Xiamen",
    offices: ["Xiamen", "Shenzhen"],
    keyPeople: "Alic Ge (oversight)",
    focus: "Eastern Hemisphere counterpart to UUL Global. Lands and maintains customer relationships originating from China — customers needing China origin, ocean, and US destination logistics.",
  },
  {
    name: "Sageline",
    nameZh: "",
    role: "US Trucking & OTR Brokerage",
    hq: "US",
    offices: ["US"],
    keyPeople: "TBD",
    focus: "Wholly owned subsidiary of UUL Global. Over-the-road (OTR) trucking brokerage. Handles domestic US trucking, drayage, and ground transportation.",
  },
];

// ─── Style maps ──────────────────────────────────────────────────

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  owner:     { bg: "bg-purple-400/10",   text: "text-purple-400" },
  board:     { bg: "bg-[#b4c5ff]/10",    text: "text-[#b4c5ff]" },
  advisor:   { bg: "bg-[#dfc299]/10",    text: "text-[#dfc299]" },
  executive: { bg: "bg-emerald-400/10",  text: "text-emerald-400" },
  team:      { bg: "bg-slate-400/10",    text: "text-slate-400" },
  admin:     { bg: "bg-red-400/10",      text: "text-red-400" },
  contributor: { bg: "bg-sky-400/10",    text: "text-sky-400" },
  viewer:    { bg: "bg-slate-400/10",    text: "text-slate-400" },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", board: "Board", advisor: "Advisor",
  executive: "Executive", team: "Team",
  admin: "Admin", contributor: "Contributor", viewer: "Member",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function PersonPill({ name, nameZh, role, title, location }: {
  name: string; nameZh?: string; role: string; title: string; location: string;
}) {
  const colors = ROLE_COLORS[role] ?? ROLE_COLORS.viewer;
  return (
    <div className="rounded-lg bg-[#131b2d] p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-sm font-semibold ${colors.text}`}>{initials(name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{name}</span>
            {nameZh && <span className="text-[12px] text-slate-500">{nameZh}</span>}
          </div>
          <span className="text-[12px] text-slate-400">{title}</span>
        </div>
        <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded shrink-0 ${colors.bg} ${colors.text}`}>
          {ROLE_LABELS[role] ?? role}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm text-slate-600">location_on</span>
        <span className="text-[11px] text-slate-500">{location}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────

interface PeopleContentProps {
  people: PersonData[];
}

export function PeopleContent({ people }: PeopleContentProps) {
  // Group DB users by department
  const byDept = people.reduce<Record<string, { color: string | null; members: PersonData[] }>>(
    (acc, person) => {
      const dept = person.departmentName ?? "No Department";
      if (!acc[dept]) acc[dept] = { color: person.departmentColor, members: [] };
      acc[dept].members.push(person);
      return acc;
    },
    {}
  );

  const deptGroups = Object.entries(byDept).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">People</h1>
        <p className="mt-2 text-sm text-slate-400">Leadership, team directory, and operating structure across UUL Global.</p>
      </div>

      {/* ── Board & Ownership ──────────────────────────────── */}
      <section>
        <h2 className="font-serif text-2xl text-white mb-4">Board & Ownership</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BOARD.map((person) => (
            <PersonPill key={person.name} {...person} location={person.location} />
          ))}
        </div>
      </section>

      {/* ── Executive Team ─────────────────────────────────── */}
      <section>
        <h2 className="font-serif text-2xl text-white mb-4">Executive Team</h2>
        <div className="rounded-lg bg-[#131b2d] overflow-hidden">
          {EXECUTIVES.map((person, i) => {
            const colors = ROLE_COLORS[person.role] ?? ROLE_COLORS.viewer;
            return (
              <div
                key={person.name}
                className={`flex items-center gap-4 px-5 py-4 ${i < EXECUTIVES.length - 1 ? "border-b border-slate-800/40" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-[12px] font-semibold ${colors.text}`}>{initials(person.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{person.name}</span>
                    {person.nameZh && <span className="text-[12px] text-slate-500">{person.nameZh}</span>}
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {ROLE_LABELS[person.role] ?? person.role}
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-400">{person.title} · {person.location}</span>
                </div>
                <span className="text-[11px] text-slate-500 hidden lg:block max-w-xs truncate">{person.responsibilities}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Team Directory (from DB) ────────────────────────── */}
      {deptGroups.length > 0 && (
        <section>
          <h2 className="font-serif text-2xl text-white mb-4">Team Directory</h2>
          <div className="space-y-6">
            {deptGroups.map(([dept, { color, members }]) => (
              <div key={dept}>
                <div className="flex items-center gap-2 mb-3">
                  {color && <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />}
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500">{dept}</span>
                  <span className="text-[10px] text-slate-700 tabular-nums">{members.length}</span>
                </div>
                <div className="rounded-lg bg-[#131b2d] overflow-hidden">
                  {members.map((person, i) => {
                    const colors = ROLE_COLORS[person.role] ?? ROLE_COLORS.viewer;
                    return (
                      <div
                        key={person.id}
                        className={`flex items-center gap-4 px-5 py-3.5 ${i < members.length - 1 ? "border-b border-slate-800/40" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                          <span className={`text-[11px] font-semibold ${colors.text}`}>{initials(person.fullName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-white">{person.fullName}</span>
                            {person.fullNameZh && <span className="text-[12px] text-slate-500">{person.fullNameZh}</span>}
                          </div>
                          {person.title && <span className="text-[12px] text-slate-400">{person.title}</span>}
                        </div>
                        {person.officeName && (
                          <div className="hidden sm:flex items-center gap-1 shrink-0">
                            <span className="material-symbols-outlined text-sm text-slate-700">location_on</span>
                            <span className="text-[11px] text-slate-500">{person.officeName}</span>
                          </div>
                        )}
                        <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded shrink-0 ${colors.bg} ${colors.text}`}>
                          {ROLE_LABELS[person.role] ?? person.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Operating Entities ──────────────────────────────── */}
      <section>
        <h2 className="font-serif text-2xl text-white mb-4">Operating Entities</h2>
        <div className="space-y-4">
          {ENTITIES.map((entity) => (
            <div key={entity.name} className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#b4c5ff]">corporate_fare</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-base font-medium text-white">{entity.name}</h3>
                    {entity.nameZh && <span className="text-[12px] text-slate-500">{entity.nameZh}</span>}
                    <span className="text-[10px] uppercase tracking-wider text-slate-600">{entity.role}</span>
                  </div>
                  <p className="text-[12px] text-slate-400 leading-relaxed mb-3">{entity.focus}</p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-600">location_on</span>
                      {entity.hq}
                    </div>
                    {entity.offices.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-slate-600">apartment</span>
                        {entity.offices.join(", ")}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-slate-600">person</span>
                      {entity.keyPeople}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
