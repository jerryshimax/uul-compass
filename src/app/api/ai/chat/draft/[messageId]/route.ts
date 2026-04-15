import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { chatMessages } from "@/db/schema/ai";
import { pmiTasks, pmiWorkstreams } from "@/db/schema/pmi";
import { risks } from "@/db/schema/risks";
import { valueInitiatives } from "@/db/schema/value-gains";
import { comments } from "@/db/schema/communication";
import { users } from "@/db/schema/org";
import { eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ADMIN_ROLES, CONTRIBUTOR_ROLES } from "@/lib/ai/tools";

function canWrite(role: string) {
  return ADMIN_ROLES.has(role) || CONTRIBUTOR_ROLES.has(role);
}

/** Resolve workstream name → UUID */
async function resolveWorkstream(name?: string): Promise<string | null> {
  if (!name) return null;
  const ws = await db
    .select({ id: pmiWorkstreams.id })
    .from(pmiWorkstreams)
    .where(ilike(pmiWorkstreams.name, `%${name}%`))
    .limit(1)
    .then((r) => r[0] ?? null);
  return ws?.id ?? null;
}

/** Resolve user full name → UUID */
async function resolveUser(name?: string): Promise<string | null> {
  if (!name) return null;
  const u = await db
    .select({ id: users.id })
    .from(users)
    .where(ilike(users.fullName, `%${name}%`))
    .limit(1)
    .then((r) => r[0] ?? null);
  return u?.id ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;
  const body = await req.json();
  const { action, editedPayload } = body as {
    action: "approve" | "discard";
    editedPayload?: Record<string, any>;
  };

  // ── Load user role ─────────────────────────────────────────────────────
  const userRecord = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1)
    .then((r) => r[0] ?? null);
  const userRole = userRecord?.role ?? "viewer";
  const userId = userRecord?.id ?? null;

  if (!canWrite(userRole)) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // ── Load the staged message ────────────────────────────────────────────
  const msg = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.id, messageId))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!msg?.draftPayload) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  if (action === "discard") {
    await db
      .update(chatMessages)
      .set({ draftStatus: "discarded" })
      .where(eq(chatMessages.id, messageId));
    return NextResponse.json({ ok: true });
  }

  // ── Execute the staged action ──────────────────────────────────────────
  // msg.draftPayload is a StagedAction { kind, entityType, description, payload: { action, ... } }
  // editedPayload (from the edit form) already spreads payload fields to the top level.
  const draftAction = msg.draftPayload as any;
  const staged = (editedPayload ?? draftAction.payload) as Record<string, any>;
  const { action: op } = staged;
  let createdId: string | null = null;

  try {
    switch (op) {
      // ── Tier 1: updates ─────────────────────────────────────────────────
      case "update_task_status": {
        await db
          .update(pmiTasks)
          .set({
            status: staged.updates.status,
            ...(staged.updates.notes ? { notes: staged.updates.notes } : {}),
            updatedAt: new Date(),
          })
          .where(eq(pmiTasks.id, staged.taskId));
        revalidatePath("/plan");
        revalidatePath("/my-tasks");
        revalidatePath(`/tasks/${staged.taskId}`);
        break;
      }

      case "update_task_progress": {
        const pct = Math.min(100, Math.max(0, staged.updates.progress));
        await db
          .update(pmiTasks)
          .set({ progress: pct, updatedAt: new Date() })
          .where(eq(pmiTasks.id, staged.taskId));
        revalidatePath("/plan");
        revalidatePath(`/tasks/${staged.taskId}`);
        break;
      }

      case "update_risk": {
        await db
          .update(risks)
          .set({
            ...(staged.updates.status ? { status: staged.updates.status } : {}),
            ...(staged.updates.severity ? { severity: staged.updates.severity } : {}),
            ...(staged.updates.notes ? { notes: staged.updates.notes } : {}),
            updatedAt: new Date(),
          })
          .where(eq(risks.id, staged.riskId));
        revalidatePath("/risks");
        break;
      }

      case "create_comment": {
        if (!userId) throw new Error("Could not resolve user");
        await db.insert(comments).values({
          authorId: userId,
          targetType: staged.targetType,
          targetId: staged.targetId,
          body: staged.body,
          isInternal: true,
        });
        revalidatePath(`/tasks/${staged.targetId}`);
        break;
      }

      // ── Tier 2: creates ─────────────────────────────────────────────────
      case "create_task": {
        const workstreamId = await resolveWorkstream(staged.workstream);
        if (!workstreamId) throw new Error(`Workstream "${staged.workstream}" not found`);
        const assigneeId = await resolveUser(staged.assignee);

        const [created] = await db
          .insert(pmiTasks)
          .values({
            title: staged.title,
            workstreamId,
            assigneeId,
            priority: staged.priority ?? "medium",
            phase: staged.phase ?? 1,
            dueDate: staged.dueDate ?? null,
            description: staged.description ?? null,
            status: "todo",
            progress: 0,
          })
          .returning({ id: pmiTasks.id });
        createdId = created.id;
        revalidatePath("/plan");
        revalidatePath("/my-tasks");
        break;
      }

      case "create_risk": {
        const workstreamId = await resolveWorkstream(staged.workstream);
        const ownerId = await resolveUser(staged.owner);

        const [created] = await db
          .insert(risks)
          .values({
            title: staged.title,
            severity: staged.severity ?? "medium",
            status: "open",
            workstreamId,
            ownerId,
            description: staged.description ?? null,
            mitigationPlan: staged.mitigationPlan ?? null,
            raisedDate: new Date().toISOString().slice(0, 10),
          })
          .returning({ id: risks.id });
        createdId = created.id;
        revalidatePath("/risks");
        break;
      }

      case "create_initiative": {
        const workstreamId = await resolveWorkstream(staged.workstream);
        const ownerId = await resolveUser(staged.owner);

        const [created] = await db
          .insert(valueInitiatives)
          .values({
            name: staged.name,
            category: staged.category,
            status: "planned",
            workstreamId,
            ownerId,
            plannedImpactCents: staged.plannedImpactCents ?? 0,
            capturedImpactCents: 0,
            progress: 0,
            description: staged.description ?? null,
          })
          .returning({ id: valueInitiatives.id });
        createdId = created.id;
        revalidatePath("/value-gains");
        break;
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${op}` }, { status: 400 });
    }

    // Mark draft as approved
    await db
      .update(chatMessages)
      .set({ draftStatus: editedPayload ? "edited" : "approved" })
      .where(eq(chatMessages.id, messageId));

    return NextResponse.json({ ok: true, createdId });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
