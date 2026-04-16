import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface StatusHeroProps {
  done: number;
  active: number;
  overdue: number;
  blocked: number;
  total: number;
}

function getOverallStatus(overdue: number, blocked: number) {
  if (overdue >= 3 || blocked >= 3) return "at-risk";
  if (overdue > 0 || blocked > 0) return "needs-attention";
  return "on-track";
}

const statusConfig = {
  "on-track": {
    label: "On Track",
    labelCN: "进展顺利",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  "needs-attention": {
    label: "Needs Attention",
    labelCN: "需要关注",
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  "at-risk": {
    label: "At Risk",
    labelCN: "存在风险",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
} as const;

export function StatusHero({ done, active, overdue, blocked, total }: StatusHeroProps) {
  const status = getOverallStatus(overdue, blocked);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-3 w-3 rounded-full ${config.dot} animate-pulse`} />
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className={`text-2xl font-bold tracking-tight ${config.color}`}>
            {config.label}
          </span>
        </div>
      </div>

      <div className="flex gap-1">
        <CountPill value={done} label="Done" color="text-emerald-400" />
        <CountPill value={active} label="Active" color="text-blue-400" />
        <CountPill value={overdue + blocked} label="Due" color={overdue + blocked > 0 ? "text-red-400" : "text-muted-foreground"} />
      </div>
    </div>
  );
}

function CountPill({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 md:px-4 py-2 rounded-lg bg-card/60 min-w-[56px] md:min-w-[72px]">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}
