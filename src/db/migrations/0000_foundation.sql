CREATE TYPE "public"."branch_role" AS ENUM('branch_manager', 'assistant_manager', 'management_trainee', 'read_only');--> statement-breakpoint
CREATE TYPE "public"."audit_actor_kind" AS ENUM('user', 'system');--> statement-breakpoint
CREATE TYPE "public"."import_source_kind" AS ENUM('synthetic_seed', 'file_upload');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "branch_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"role" "branch_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"time_zone" text NOT NULL,
	"is_synthetic" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_id_org_uq" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_synthetic" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"is_synthetic" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"branch_id" uuid,
	"actor_kind" "audit_actor_kind" NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_branch_requires_org" CHECK ("audit_events"."branch_id" IS NULL OR "audit_events"."organization_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "data_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"source_kind" "import_source_kind" NOT NULL,
	"source_label" text NOT NULL,
	"file_name" text,
	"content_sha256" text,
	"status" "import_status" NOT NULL,
	"data_as_of" timestamp with time zone,
	"row_count" integer,
	"accepted_row_count" integer,
	"rejected_row_count" integer,
	"created_by_user_id" uuid,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "branch_memberships" ADD CONSTRAINT "branch_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_memberships" ADD CONSTRAINT "branch_memberships_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_branch_org_fk" FOREIGN KEY ("branch_id","organization_id") REFERENCES "public"."branches"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_imports" ADD CONSTRAINT "data_imports_branch_org_fk" FOREIGN KEY ("branch_id","organization_id") REFERENCES "public"."branches"("id","organization_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "branch_memberships_user_branch_uq" ON "branch_memberships" USING btree ("user_id","branch_id");--> statement-breakpoint
CREATE INDEX "branch_memberships_branch_idx" ON "branch_memberships" USING btree ("branch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_org_slug_uq" ON "branches" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "audit_events_branch_occurred_idx" ON "audit_events" USING btree ("branch_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "data_imports_branch_sha_uq" ON "data_imports" USING btree ("branch_id","content_sha256");--> statement-breakpoint
CREATE INDEX "data_imports_branch_started_idx" ON "data_imports" USING btree ("branch_id","started_at");