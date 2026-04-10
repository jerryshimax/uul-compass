CREATE TYPE "public"."access_level" AS ENUM('full', 'read', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."action_item_status" AS ENUM('open', 'done', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."bl_type" AS ENUM('original', 'telex_release', 'seaway_bill', 'express');--> statement-breakpoint
CREATE TYPE "public"."carrier_type" AS ENUM('ocean', 'air', 'trucking', 'drayage', 'rail', 'nvocc', 'courier', 'multi_modal');--> statement-breakpoint
CREATE TYPE "public"."charge_category" AS ENUM('origin', 'freight', 'destination', 'customs', 'insurance', 'trucking', 'warehousing', 'other');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('customer', 'carrier', 'partner', 'advisor', 'vendor', 'customs_broker', 'agent', 'other');--> statement-breakpoint
CREATE TYPE "public"."container_type" AS ENUM('20GP', '40GP', '40HC', '45HC', '20RF', '40RF', '20OT', '40OT', '20FR', '40FR', '20TK', 'LCL');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'expired', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('prospect', 'active', 'inactive', 'suspended', 'churned');--> statement-breakpoint
CREATE TYPE "public"."customs_status" AS ENUM('pending', 'filed', 'under_review', 'hold', 'cleared', 'liquidated', 'protest');--> statement-breakpoint
CREATE TYPE "public"."direction" AS ENUM('import', 'export', 'domestic', 'cross_trade');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('bill_of_lading', 'airway_bill', 'commercial_invoice', 'packing_list', 'certificate_of_origin', 'customs_entry', 'isf', 'arrival_notice', 'delivery_order', 'pod', 'cargo_insurance', 'letter_of_credit', 'booking_confirmation', 'carrier_invoice', 'contract', 'sop', 'rate_sheet', 'correspondence', 'photo', 'other');--> statement-breakpoint
CREATE TYPE "public"."exception_type" AS ENUM('delay', 'customs_hold', 'damage', 'shortage', 'documentation', 'carrier_issue', 'weather', 'port_congestion', 'demurrage', 'detention', 'other');--> statement-breakpoint
CREATE TYPE "public"."gate_status" AS ENUM('upcoming', 'ready', 'passed', 'failed', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."incoterm" AS ENUM('EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP');--> statement-breakpoint
CREATE TYPE "public"."industry" AS ENUM('ai_infrastructure', 'renewable_energy', 'advanced_manufacturing', 'automotive', 'electronics', 'consumer_goods', 'pharma', 'chemicals', 'agriculture', 'construction', 'food_beverage', 'other');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."phase_status" AS ENUM('not_started', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."pipeline_stage" AS ENUM('prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."pmi_status" AS ENUM('not_started', 'in_progress', 'at_risk', 'completed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."rate_unit" AS ENUM('per_container', 'per_cbm', 'per_kg', 'per_cwt', 'per_mile', 'per_shipment', 'flat', 'per_pallet');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('received', 'in_progress', 'quoted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."risk_severity" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."risk_status" AS ENUM('open', 'mitigating', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('draft', 'booked', 'confirmed', 'in_transit_origin', 'at_origin_port', 'departed', 'in_transit', 'arrived', 'customs_hold', 'customs_cleared', 'in_delivery', 'delivered', 'completed', 'cancelled', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'blocked', 'review', 'done');--> statement-breakpoint
CREATE TYPE "public"."transport_mode" AS ENUM('ocean_fcl', 'ocean_lcl', 'air', 'trucking_ftl', 'trucking_ltl', 'drayage', 'rail', 'courier', 'multi_modal');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'board', 'advisor', 'executive', 'department_head', 'manager', 'operator', 'sales', 'finance', 'compliance', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."value_category" AS ENUM('cost_savings', 'revenue_growth', 'cash_flow');--> statement-breakpoint
CREATE TYPE "public"."value_status" AS ENUM('planned', 'in_progress', 'capturing', 'captured');--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"name_zh" varchar(255),
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"company" varchar(255),
	"title" varchar(255),
	"contact_type" "contact_type" DEFAULT 'other' NOT NULL,
	"is_primary" boolean DEFAULT false,
	"tags" text[],
	"notes" text,
	"relationship_owner_id" uuid,
	"last_interaction_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"color" varchar(20),
	"head_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_zh" varchar(255),
	"legal_name" varchar(255),
	"country" varchar(2),
	"currency" varchar(3) DEFAULT 'USD',
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"city" varchar(100),
	"country" varchar(2),
	"timezone" varchar(50),
	"is_headquarters" boolean DEFAULT false,
	"address" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_entity_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	"access_level" "access_level" DEFAULT 'full' NOT NULL,
	CONSTRAINT "user_entity_access_user_id_entity_id_unique" UNIQUE("user_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_id" uuid,
	"entity_id" uuid,
	"office_id" uuid,
	"department_id" uuid,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"full_name_zh" varchar(255),
	"title" varchar(255),
	"phone" varchar(50),
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"reports_to" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"avatar_url" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_id_unique" UNIQUE("auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "pmi_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workstream_id" uuid NOT NULL,
	"code" varchar(20),
	"name" varchar(255) NOT NULL,
	"description" text,
	"phase" integer DEFAULT 1 NOT NULL,
	"target_date" date,
	"completed_date" date,
	"status" "pmi_status" DEFAULT 'not_started' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmi_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workstream_id" uuid NOT NULL,
	"milestone_id" uuid,
	"task_code" varchar(10),
	"phase" integer DEFAULT 1 NOT NULL,
	"is_cross_office" boolean DEFAULT false NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"assignee_id" uuid,
	"reporter_id" uuid,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"progress" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"meeting_id" uuid,
	"tags" text[],
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmi_workstreams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(20),
	"department_id" uuid,
	"owner_id" uuid,
	"target_completion" integer DEFAULT 0,
	"sort_order" integer DEFAULT 0,
	"status" "pmi_status" DEFAULT 'not_started' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid,
	"target_type" varchar(50),
	"target_id" uuid,
	"title" varchar(500) NOT NULL,
	"description" text,
	"assignee_id" uuid,
	"due_date" date,
	"status" "action_item_status" DEFAULT 'open' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"actor_id" uuid,
	"action" varchar(50) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"target_label" varchar(255),
	"changes" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"author_id" uuid NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" uuid NOT NULL,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT true,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "meeting_attendees_meeting_id_user_id_unique" UNIQUE("meeting_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "meeting_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"title" varchar(255) NOT NULL,
	"meeting_date" date NOT NULL,
	"meeting_type" varchar(50),
	"body" text,
	"decisions" jsonb,
	"brain_note_path" text,
	"gdrive_link" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"table_name" varchar(100),
	"record_id" uuid,
	"old_values" jsonb,
	"new_values" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration" varchar(50) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"method" varchar(10) NOT NULL,
	"endpoint" text,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"target_type" varchar(50),
	"target_id" uuid,
	"duration_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmi_config" (
	"id" varchar(20) PRIMARY KEY DEFAULT 'default' NOT NULL,
	"start_date" date NOT NULL,
	"total_days" integer DEFAULT 100 NOT NULL,
	"project_name" varchar(255) DEFAULT 'UUL Post-Merger Integration',
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmi_decision_gates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"target_day" integer NOT NULL,
	"target_date" date,
	"status" "gate_status" DEFAULT 'upcoming' NOT NULL,
	"owner_label" varchar(255),
	"criteria" jsonb,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pmi_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"phase_number" integer NOT NULL,
	"start_day" integer NOT NULL,
	"end_day" integer NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" "phase_status" DEFAULT 'not_started' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "value_initiatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "value_category" NOT NULL,
	"description" text,
	"target_description" varchar(255),
	"planned_impact_cents" integer DEFAULT 0,
	"captured_impact_cents" integer DEFAULT 0,
	"status" "value_status" DEFAULT 'planned' NOT NULL,
	"owner_id" uuid,
	"workstream_id" uuid,
	"progress" integer DEFAULT 0 NOT NULL,
	"meeting_id" uuid,
	"measurement_method" text,
	"start_date" date,
	"target_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "value_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"initiative_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"run_rate_cents" integer DEFAULT 0,
	"cumulative_cents" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"severity" "risk_severity" DEFAULT 'medium' NOT NULL,
	"status" "risk_status" DEFAULT 'open' NOT NULL,
	"mitigation_plan" text,
	"owner_id" uuid,
	"workstream_id" uuid,
	"linked_task_codes" text[],
	"notes" text,
	"meeting_id" uuid,
	"raised_date" date,
	"target_date" date,
	"resolved_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_relationship_owner_id_users_id_fk" FOREIGN KEY ("relationship_owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_id_users_id_fk" FOREIGN KEY ("head_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entity_access" ADD CONSTRAINT "user_entity_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_entity_access" ADD CONSTRAINT "user_entity_access_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reports_to_users_id_fk" FOREIGN KEY ("reports_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_milestones" ADD CONSTRAINT "pmi_milestones_workstream_id_pmi_workstreams_id_fk" FOREIGN KEY ("workstream_id") REFERENCES "public"."pmi_workstreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_tasks" ADD CONSTRAINT "pmi_tasks_workstream_id_pmi_workstreams_id_fk" FOREIGN KEY ("workstream_id") REFERENCES "public"."pmi_workstreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_tasks" ADD CONSTRAINT "pmi_tasks_milestone_id_pmi_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."pmi_milestones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_tasks" ADD CONSTRAINT "pmi_tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_tasks" ADD CONSTRAINT "pmi_tasks_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_tasks" ADD CONSTRAINT "pmi_tasks_meeting_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_workstreams" ADD CONSTRAINT "pmi_workstreams_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_workstreams" ADD CONSTRAINT "pmi_workstreams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_meeting_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_items" ADD CONSTRAINT "action_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_meeting_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_decision_gates" ADD CONSTRAINT "pmi_decision_gates_phase_id_pmi_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."pmi_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pmi_decision_gates" ADD CONSTRAINT "pmi_decision_gates_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_initiatives" ADD CONSTRAINT "value_initiatives_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_initiatives" ADD CONSTRAINT "value_initiatives_workstream_id_pmi_workstreams_id_fk" FOREIGN KEY ("workstream_id") REFERENCES "public"."pmi_workstreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_initiatives" ADD CONSTRAINT "value_initiatives_meeting_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "value_snapshots" ADD CONSTRAINT "value_snapshots_initiative_id_value_initiatives_id_fk" FOREIGN KEY ("initiative_id") REFERENCES "public"."value_initiatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_workstream_id_pmi_workstreams_id_fk" FOREIGN KEY ("workstream_id") REFERENCES "public"."pmi_workstreams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_meeting_id_meeting_notes_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meeting_notes"("id") ON DELETE no action ON UPDATE no action;