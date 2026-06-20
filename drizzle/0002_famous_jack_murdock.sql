CREATE TABLE "worker_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"ok" integer,
	"failed" integer,
	"errors" text
);
