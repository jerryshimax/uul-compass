# UUL Compass — API Schema Reference

> Machine-readable reference for external AI integrations (e.g. meeting transcript processors).
> All IDs are UUIDs. All timestamps are UTC with timezone. DB: PostgreSQL via Supabase + Drizzle ORM.

---

## Key Design Rules

- **All primary keys are UUIDs** — never integers.
- **People are stored by UUID** (`assignee_id`, `owner_id`). Resolve names via `users.full_name` → UUID at request time.
- **Workstreams are stored by UUID** (`workstream_id`). Resolve names via `pmi_workstreams.name` → UUID.
- **Notes vs Description**: `description` is the original write-up (set at creation). `notes` is the latest update note from a meeting (overwritten each time).
- **Audit trail**: every POST to the meeting endpoint creates a `meeting_notes` record and writes to the `activities` table. `meeting_id` on tasks/risks/initiatives points to the last meeting that modified them.

---

## Tables

### `pmi_tasks`
> PMI workstream tasks. Exposed as `/api/tasks/list`.

| Column | DB Type | Drizzle Field | Notes |
|--------|---------|---------------|-------|
| `id` | uuid PK | `id` | Use this as `task_id` in API calls |
| `task_code` | varchar(10) | `taskCode` | Short code e.g. `"F1"`, `"O12"` — use for fuzzy name matching |
| `title` | varchar(500) | `title` | |
| `workstream_id` | uuid FK → `pmi_workstreams.id` | `workstreamId` | |
| `milestone_id` | uuid FK → `pmi_milestones.id` | `milestoneId` | nullable |
| `assignee_id` | uuid FK → `users.id` | `assigneeId` | nullable |
| `reporter_id` | uuid FK → `users.id` | `reporterId` | nullable |
| `status` | enum `task_status` | `status` | See enum values below |
| `priority` | enum `task_priority` | `priority` | See enum values below |
| `progress` | integer (0–100) | `progress` | default 0 |
| `due_date` | date | `dueDate` | format `YYYY-MM-DD` |
| `completed_at` | timestamptz | `completedAt` | nullable |
| `description` | text | `description` | original task description — do not overwrite from meetings |
| `notes` | text | `notes` | latest meeting update note — overwrite each time |
| `meeting_id` | uuid FK → `meeting_notes.id` | `meetingId` | last meeting that modified this task |
| `phase` | integer | `phase` | 1, 2, or 3 |
| `is_cross_office` | boolean | `isCrossOffice` | default false |
| `tags` | text[] | `tags` | |
| `metadata` | jsonb | `metadata` | |
| `created_at` | timestamptz | `createdAt` | |
| `updated_at` | timestamptz | `updatedAt` | |

**`task_status` enum values:** `todo`, `in_progress`, `blocked`, `review`, `done`

**`task_priority` enum values:** `critical`, `high`, `medium`, `low`

**Status mapping from meeting AI output:**
| AI sends | Store as |
|----------|----------|
| `not_started` | `todo` |
| `in_progress` | `in_progress` |
| `blocked` | `blocked` |
| `completed` | `done` |

---

### `risks`
> Project risks. Exposed as `/api/risks/list`.

| Column | DB Type | Drizzle Field | Notes |
|--------|---------|---------------|-------|
| `id` | uuid PK | `id` | Use this as `risk_id` in API calls |
| `title` | varchar(500) | `title` | |
| `description` | text | `description` | original risk description — do not overwrite from meetings |
| `notes` | text | `notes` | latest meeting update note — overwrite each time |
| `severity` | enum `risk_severity` | `severity` | `high`, `medium`, `low` |
| `status` | enum `risk_status` | `status` | See enum values below |
| `mitigation_plan` | text | `mitigationPlan` | |
| `owner_id` | uuid FK → `users.id` | `ownerId` | nullable |
| `workstream_id` | uuid FK → `pmi_workstreams.id` | `workstreamId` | nullable — use instead of `category` |
| `linked_task_codes` | text[] | `linkedTaskCodes` | e.g. `["F1", "O2"]` |
| `meeting_id` | uuid FK → `meeting_notes.id` | `meetingId` | last meeting that modified this risk |
| `raised_date` | date | `raisedDate` | format `YYYY-MM-DD` |
| `target_date` | date | `targetDate` | |
| `resolved_date` | date | `resolvedDate` | |
| `created_at` | timestamptz | `createdAt` | |
| `updated_at` | timestamptz | `updatedAt` | |

**`risk_status` enum values:** `open`, `mitigating`, `resolved`

**`risk_severity` enum values:** `high`, `medium`, `low`

**Status mapping from meeting AI output:**
| AI sends | Store as |
|----------|----------|
| `active` | `open` |
| `mitigated` | `mitigating` |
| `closed` | `resolved` |

> **No `category` column.** Risks are categorized by `workstream_id`. Resolve workstream name → UUID when creating new risks.

---

### `value_initiatives`
> Value/profit improvement initiatives. Exposed as `/api/initiatives/list`.

| Column | DB Type | Drizzle Field | Notes |
|--------|---------|---------------|-------|
| `id` | uuid PK | `id` | Use this as `initiative_id` in API calls |
| `name` | varchar(255) | `name` | Note: field is `name`, not `title` |
| `category` | enum `value_category` | `category` | `cost_savings`, `revenue_growth`, `cash_flow` |
| `description` | text | `description` | |
| `target_description` | varchar(255) | `targetDescription` | e.g. `"+3-5% revenue"` |
| `status` | enum `value_status` | `status` | `planned`, `in_progress`, `capturing`, `captured` |
| `progress` | integer (0–100) | `progress` | default 0 |
| `planned_impact_cents` | integer | `plannedImpactCents` | USD cents |
| `captured_impact_cents` | integer | `capturedImpactCents` | USD cents |
| `owner_id` | uuid FK → `users.id` | `ownerId` | nullable |
| `workstream_id` | uuid FK → `pmi_workstreams.id` | `workstreamId` | nullable |
| `meeting_id` | uuid FK → `meeting_notes.id` | `meetingId` | last meeting that modified this initiative |
| `measurement_method` | text | `measurementMethod` | |
| `start_date` | date | `startDate` | |
| `target_date` | date | `targetDate` | |
| `created_at` | timestamptz | `createdAt` | |
| `updated_at` | timestamptz | `updatedAt` | |

---

### `meeting_notes`
> Created by the POST endpoint to record each meeting processed. Used as the audit anchor.

| Column | DB Type | Drizzle Field | Notes |
|--------|---------|---------------|-------|
| `id` | uuid PK | `id` | Returned as `meeting_id` in POST response |
| `title` | varchar(255) | `title` | e.g. `"UUL Board Call - Apr 9"` |
| `meeting_date` | date | `meetingDate` | format `YYYY-MM-DD` |
| `meeting_type` | varchar(50) | `meetingType` | `board`, `leadership`, `department`, `strategy` |
| `body` | text | `body` | full notes/transcript summary |
| `decisions` | jsonb | `decisions` | array of decision strings |
| `created_by` | uuid FK → `users.id` | `createdBy` | set to API service user |
| `created_at` | timestamptz | `createdAt` | auto |

Attendees stored in `meeting_attendees` junction: `(meeting_id, user_id)`.

---

### `activities`
> Append-only change log. Written by the POST endpoint for every field change.

| Column | DB Type | Notes |
|--------|---------|-------|
| `id` | uuid PK | |
| `target_type` | varchar(50) | `"task"`, `"risk"`, `"initiative"` |
| `target_id` | uuid | ID of the changed record |
| `action` | varchar(50) | `"updated"`, `"created"` |
| `target_label` | varchar(255) | human-readable name of the record |
| `changes` | jsonb | `{ "field": { "old": x, "new": y } }` |
| `actor_id` | uuid FK → `users.id` | set to API service user |
| `created_at` | timestamptz | auto |

---

### `users`
> Internal team members. Used to resolve names → UUIDs.

| Column | DB Type | Notes |
|--------|---------|-------|
| `id` | uuid PK | |
| `full_name` | varchar(255) | e.g. `"Jerry Shi"`, `"Ray Chen"` — match against this |
| `full_name_zh` | varchar(255) | Chinese name — also try matching against this |
| `email` | varchar(255) | |
| `role` | enum `user_role` | |
| `is_active` | boolean | only match active users |

---

### `pmi_workstreams`
> Used to resolve workstream names → UUIDs for tasks, risks, and initiatives.

| Column | DB Type | Notes |
|--------|---------|-------|
| `id` | uuid PK | |
| `name` | varchar(255) | e.g. `"Operations"`, `"Finance"`, `"Technology"` |
| `status` | enum `pmi_status` | |

---

## API Endpoints

### Auth
All endpoints require: `Authorization: Bearer {CLOUD_API_KEY}`
The key is stored in env var `CLOUD_API_KEY`.

---

### GET /api/tasks/list

Returns all tasks with resolved names for assignee and workstream.

**Response:**
```json
[
  {
    "id": "uuid",
    "task_code": "F1",
    "title": "IT System Integration",
    "workstream_id": "uuid",
    "workstream_name": "Technology",
    "assignee_id": "uuid",
    "assignee_name": "Ray Chen",
    "status": "in_progress",
    "priority": "high",
    "progress": 60,
    "due_date": "2026-05-15",
    "notes": "last meeting note text",
    "phase": 1
  }
]
```

---

### GET /api/risks/list

Returns all risks with resolved owner and workstream names.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Supply chain bottleneck",
    "severity": "high",
    "status": "open",
    "owner_id": "uuid",
    "owner_name": "Zhang Wei",
    "workstream_id": "uuid",
    "workstream_name": "Operations",
    "notes": "last meeting note text",
    "raised_date": "2026-03-01"
  }
]
```

---

### GET /api/initiatives/list

Returns all value initiatives with resolved owner names.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Digital Transformation",
    "category": "cost_savings",
    "status": "in_progress",
    "progress": 65,
    "owner_id": "uuid",
    "owner_name": "Jerry Shi",
    "workstream_id": "uuid",
    "workstream_name": "Technology",
    "planned_impact_cents": 500000,
    "captured_impact_cents": 120000
  }
]
```

---

### POST /api/meeting/process

Processes all updates from a single meeting in one payload. All arrays are optional.

**Request body:**
```json
{
  "source": {
    "type": "board_call",
    "title": "UUL Board Call - Apr 9",
    "date": "2026-04-09",
    "participants": ["Jerry Shi", "Ray Chen"]
  },
  "task_updates": [
    {
      "task_id": "uuid",
      "updates": {
        "status": "in_progress",
        "progress": 80,
        "notes": "IT integration on track, vendor confirmed delivery"
      }
    }
  ],
  "new_tasks": [
    {
      "title": "Finalize warehouse lease renewal",
      "workstream": "Operations",
      "assignee": "Ray Chen",
      "priority": "high",
      "status": "not_started",
      "due_date": "2026-05-15",
      "notes": "Landlord wants answer by end of month"
    }
  ],
  "risk_updates": [
    {
      "risk_id": "uuid",
      "updates": {
        "severity": "high",
        "status": "mitigating",
        "notes": "Mitigation plan approved"
      }
    }
  ],
  "new_risks": [
    {
      "title": "Customs clearance delays at Shenzhen port",
      "severity": "high",
      "workstream": "Operations",
      "owner": "Zhang Wei",
      "description": "New inspection rules effective May 1, expect 3-5 day delays",
      "mitigation": "Pre-file documentation, use bonded warehouse as buffer"
    }
  ],
  "initiative_updates": [
    {
      "initiative_id": "uuid",
      "updates": {
        "progress": 65,
        "notes": "Phase 2 kickoff confirmed for next month"
      }
    }
  ]
}
```

**Field notes for the AI:**
- `source.type`: use `board_call`, `meeting`, `transcript`, or `notes` — mapped to `meeting_type` in DB
- `task_updates[].updates.status`: must be one of `todo`, `in_progress`, `blocked`, `review`, `done` (or the alias values listed in the status mapping table above)
- `risk_updates[].updates.status`: must be one of `open`, `mitigating`, `resolved` (or alias values)
- `new_tasks[].workstream`: plain text name — resolved to `workstream_id` by the server
- `new_tasks[].assignee`: plain text name — resolved to `assignee_id` via `users.full_name` by the server
- `new_risks[].owner`: plain text name — resolved to `owner_id` by the server
- `new_risks[].workstream`: plain text name — resolved to `workstream_id` by the server

**Response:**
```json
{
  "success": true,
  "meeting_id": "uuid",
  "summary": {
    "tasks_updated": 4,
    "tasks_created": 2,
    "risks_updated": 1,
    "risks_created": 1,
    "initiatives_updated": 1
  },
  "details": {
    "tasks_updated": [
      { "task_id": "uuid", "title": "IT Integration", "changes": { "progress": "60 -> 80" } }
    ],
    "tasks_created": [
      { "task_id": "uuid", "title": "Finalize warehouse lease renewal" }
    ],
    "risks_updated": [
      { "risk_id": "uuid", "title": "Supply chain bottleneck" }
    ],
    "risks_created": [
      { "risk_id": "uuid", "title": "Customs clearance delays at Shenzhen port" }
    ],
    "initiatives_updated": [
      { "initiative_id": "uuid", "title": "Digital Transformation" }
    ]
  },
  "errors": []
}
```

**Partial failure response** (process what you can, report errors for the rest):
```json
{
  "success": false,
  "meeting_id": "uuid",
  "summary": { "tasks_updated": 3, "tasks_created": 0 },
  "errors": [
    { "type": "task_update", "task_id": "bad-uuid", "error": "Task not found" },
    { "type": "new_task", "index": 0, "error": "Workstream not found: 'Unknowns'" }
  ]
}
```

---

## Name Resolution Logic (server-side)

When the AI sends a plain text name (assignee, owner, workstream), the server:
1. Queries `users` where `full_name ILIKE $name OR full_name_zh ILIKE $name` and `is_active = true`
2. If no match → returns an error for that item (partial failure, rest continues)
3. If multiple matches → returns an error asking for disambiguation

For workstreams:
1. Queries `pmi_workstreams` where `name ILIKE $name`
2. Same error behavior on no match or ambiguous match

---

## Recommended Pre-flight Workflow for AI

Before processing a meeting transcript:
1. `GET /api/tasks/list` — build a lookup map of `title + task_code → task_id`
2. `GET /api/risks/list` — build a lookup map of `title → risk_id`
3. `GET /api/initiatives/list` — build a lookup map of `name → initiative_id`
4. Match transcript references to IDs (fuzzy match on title/code)
5. `POST /api/meeting/process` with resolved IDs in `task_id`, `risk_id`, `initiative_id` fields
