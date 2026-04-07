const leadership = [
  { name: "Alic Ge", nameZh: "葛成", role: "board", title: "Chairman of the Board", location: "Ningbo", responsibilities: "Overall governance, China operations oversight, carrier relationships, institutional knowledge" },
  { name: "Jerry Shi", nameZh: "施童洲", role: "owner", title: "PE Owner & Board Member", location: "Toronto / Asia", responsibilities: "Strategic direction, capital deployment, AI transformation, fund management" },
  { name: "Billy Cheng", nameZh: "", role: "board", title: "HK CEO & Board Member", location: "Hong Kong", responsibilities: "Hong Kong operations, regional partnerships, board governance" },
  { name: "Season Yu", nameZh: "", role: "advisor", title: "PE Partner, Finance Advisor", location: "Shanghai", responsibilities: "Financial oversight, cross-entity incentive design, PE advisory" },
];

const executives = [
  { name: "Jason Likens", nameZh: "", role: "executive", title: "CEO, US Operations", location: "US", responsibilities: "US P&L, sales leadership, customer relationships, carrier negotiations" },
  { name: "Josh Foster", nameZh: "", role: "executive", title: "COO, US Operations", location: "US", responsibilities: "US operations, logistics execution, process optimization" },
  { name: "Serena Lin", nameZh: "林静", role: "executive", title: "CFO", location: "China", responsibilities: "Financial reporting, AR/AP management, cash flow forecasting, compliance" },
  { name: "David Wu", nameZh: "", role: "team", title: "Engineer", location: "North America", responsibilities: "Compass OS development, Pallet.AI integration, data architecture" },
];

const entities = [
  {
    name: "UUL Global",
    nameZh: "美航物流集团",
    role: "Global HQ & Profit Center",
    hq: "Greensboro, NC",
    offices: ["US (Greensboro)", "Hong Kong", "Vietnam"],
    keyPeople: "Jason Likens (CEO), Josh Foster (COO)",
    focus: "Global headquarters and profit center. Handles all customer-facing sales for Western Hemisphere clients. Freight forwarding, customs clearance, last-mile delivery. FMC-licensed NVOCC, US Customs Broker. Revenue and margin ownership — all customer contracts flow through UUL Global.",
  },
  {
    name: "US United Logistics",
    nameZh: "美航",
    role: "Global Operations & Fulfillment",
    hq: "Shenzhen",
    offices: ["Shenzhen", "Shanghai", "Ningbo", "Guangzhou"],
    keyPeople: "Alic Ge (Chairman)",
    focus: "Operations and fulfillment hub acting as vendor to UUL Global. Fulfills ocean carrier bookings, China origin bookings, and origin-to-ocean services. ~50 employees. Holds key carrier relationships (MSC, CMA, Golden Standard). Cost center — executes logistics on behalf of UUL Global's customer contracts.",
  },
  {
    name: "Star Navigation",
    nameZh: "星航",
    role: "Eastern Hemisphere Sales & Customers",
    hq: "Xiamen",
    offices: ["Xiamen", "Shenzhen"],
    keyPeople: "Alic Ge (oversight)",
    focus: "The Eastern Hemisphere counterpart to UUL Global. Lands and maintains customer relationships originating from China — customers that need China origin, ocean, and US destination logistics. Where UUL Global serves Western customers going East, Star Navigation serves Chinese customers going West. On end-to-end deals, UUL Global and Star Navigation co-sell and loop in US United as the fulfillment vendor. Different customer base, complementary trade lanes.",
  },
  {
    name: "Sageline",
    nameZh: "",
    role: "US Trucking & OTR Brokerage",
    hq: "US",
    offices: ["US"],
    keyPeople: "TBD",
    focus: "Wholly owned subsidiary of UUL Global. Over-the-road (OTR) trucking brokerage. Handles domestic US trucking, drayage, and ground transportation — the last-mile and inland leg of international shipments.",
  },
];

const roleColors: Record<string, { bg: string; text: string; dot: string }> = {
  owner: { bg: "bg-purple-400/10", text: "text-purple-400", dot: "bg-purple-400" },
  board: { bg: "bg-[#b4c5ff]/10", text: "text-[#b4c5ff]", dot: "bg-[#b4c5ff]" },
  advisor: { bg: "bg-[#dfc299]/10", text: "text-[#dfc299]", dot: "bg-[#dfc299]" },
  executive: { bg: "bg-emerald-400/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  team: { bg: "bg-slate-400/10", text: "text-slate-400", dot: "bg-slate-500" },
};

const roleLabels: Record<string, string> = {
  owner: "Owner",
  board: "Board",
  advisor: "Advisor",
  executive: "Executive",
  team: "Team",
};

export default function OrganizationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-light tracking-tight text-white">
          Organization
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Leadership, entities, and operating structure across UUL Global.
        </p>
      </div>

      {/* ── Board & Leadership ──────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-4">Board & Leadership</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {leadership.map((person) => {
            const colors = roleColors[person.role] || roleColors.team;
            return (
              <div key={person.name} className="rounded-lg bg-[#131b2d] p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {person.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{person.name}</span>
                      {person.nameZh && <span className="text-[12px] text-slate-500">{person.nameZh}</span>}
                    </div>
                    <span className="text-[12px] text-slate-400">{person.title}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    {roleLabels[person.role]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-sm text-slate-600">location_on</span>
                  <span className="text-[11px] text-slate-500">{person.location}</span>
                </div>
                <p className="text-[12px] text-slate-400 leading-relaxed">{person.responsibilities}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Executive Team ──────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-4">Executive Team</h2>
        <div className="space-y-2">
          {executives.map((person) => {
            const colors = roleColors[person.role] || roleColors.team;
            return (
              <div key={person.name} className="rounded-lg bg-[#131b2d] px-5 py-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-[12px] font-semibold ${colors.text}`}>
                    {person.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{person.name}</span>
                    {person.nameZh && <span className="text-[12px] text-slate-500">{person.nameZh}</span>}
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {roleLabels[person.role]}
                    </span>
                  </div>
                  <span className="text-[12px] text-slate-400">{person.title} &middot; {person.location}</span>
                </div>
                <span className="text-[11px] text-slate-500 hidden lg:block max-w-xs truncate">{person.responsibilities}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Entities ────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-2xl text-white mb-4">Operating Entities</h2>
        <div className="space-y-4">
          {entities.map((entity) => (
            <div key={entity.name} className="rounded-lg bg-[#131b2d] p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#1a2744] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#b4c5ff]">corporate_fare</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
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
      </div>
    </div>
  );
}
