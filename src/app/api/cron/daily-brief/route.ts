/**
 * GET /api/cron/daily-brief — Generates the morning Daily Brief per user.
 *
 * v2 scope: writes a row to ai_briefs (kind="daily_personal") for each
 * active user. The Brief synthesizes:
 *   - PMI tasks due in next 7 days
 *   - Open AI insights (severity >= warning)
 *   - Project milestones at risk (slack < 14 days)
 *   - AR aging changes (when finance integration lands)
 *
 * Triggered by Vercel Cron (see vercel.json) at 06:00 ET, Mon-Fri.
 *
 * Auth: relies on CRON_SECRET header check — Vercel Cron sets
 * `Authorization: Bearer ${CRON_SECRET}` automatically.
 *
 * NOTE: This is a v2 prototype scaffold. The real synthesis pipeline
 * (joining ai_insights + pmi_tasks + projects + ai_messages → LLM call →
 * structured Brief body) lives in Phase 2 sprint planning.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BriefHighlight {
  kind: "task_due" | "insight" | "milestone_risk" | "ar_change";
  text: string;
  link?: string;
}

interface GeneratedBrief {
  userId: string;
  userName: string;
  forDate: string;
  title: string;
  highlights: BriefHighlight[];
}

const DEMO_USERS = [
  { id: "user-jerry", name: "Jerry Shi" },
  { id: "user-david", name: "David Chen" },
  { id: "user-season", name: "Season Liu" },
  { id: "user-marco", name: "Marco Rodriguez" },
  { id: "user-russ", name: "Russ Langley" },
  { id: "user-alic", name: "Alic Ge" },
];

function buildHighlightsForUser(userId: string): BriefHighlight[] {
  // v2 stub — production version joins ai_insights + pmi_tasks + project_milestones
  // for this user, ranked by severity × $ exposure × time-to-action.
  const universal: BriefHighlight[] = [
    {
      kind: "milestone_risk",
      text: "Hyperscale 135 MW commissioning — 12d slack, GS-A-018 customs hold (Yantian)",
      link: "/projects/proj-hs-phase1",
    },
  ];

  if (userId === "user-jerry" || userId === "user-season") {
    universal.push({
      kind: "ar_change",
      text: "Silfab open AR ticked up $182K WoW — now $410K, oldest invoice 47 days",
      link: "/customers/cust-silfab",
    });
  }

  if (userId === "user-marco" || userId === "user-alic") {
    universal.push({
      kind: "task_due",
      text: "Yantian escalation memo for hyperscale Tranche A due EOD",
      link: "/my-tasks",
    });
  }

  return universal;
}

function generateBriefs(forDate: string): GeneratedBrief[] {
  return DEMO_USERS.map((u) => {
    const highlights = buildHighlightsForUser(u.id);
    const firstName = u.name.split(" ")[0];
    return {
      userId: u.id,
      userName: u.name,
      forDate,
      title: `${firstName}'s Brief — ${new Date(forDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`,
      highlights,
    };
  });
}

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron/daily-brief] unauthorized request");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const forDate = new Date().toISOString().slice(0, 10);

  try {
    const briefs = generateBriefs(forDate);

    // v2 stub: production pipeline is
    //   1. await db.insert(aiBriefs).values(briefs.map(toBriefRow))
    //   2. await Promise.all(briefs.map(b => sendPushNotification(b.userId, b.title)))
    // Both gated on Brain RAG indexer + push subscriptions schema (S4 deliverables).

    console.log("[cron/daily-brief] generated", {
      forDate,
      count: briefs.length,
      latencyMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      ok: true,
      forDate,
      briefsGenerated: briefs.length,
      persisted: false,
      note: "v2 prototype — persistence + push delivery wires in Sprint S4 follow-up",
      preview: briefs,
    });
  } catch (err) {
    console.error("[cron/daily-brief] failed", { forDate, error: err });
    return NextResponse.json(
      { error: "brief_generation_failed", forDate },
      { status: 500 },
    );
  }
}
