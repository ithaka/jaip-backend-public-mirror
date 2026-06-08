-- PRISMA MIGRATION DATA
-- This is manually added to the prisma migration file to ensure that the pg_trgm extension is 
-- created before any tables or indexes that depend on it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "alert_statuses" AS ENUM ('info', 'warning', 'error', 'success');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "entity_types" AS ENUM ('programs', 'users', 'facilities');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "jstor_types" AS ENUM ('doi', 'headid', 'discipline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "status_options" AS ENUM ('Pending', 'Approved', 'Denied', 'Incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "user_roles" AS ENUM ('admin', 'user', 'removed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "alerts" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "status" "alert_statuses" NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) DEFAULT (CURRENT_DATE + '7 days'::interval),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "targeted_alerts" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "status" "alert_statuses" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "targeted_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "alerts_facilities" (
    "alert_id" INTEGER NOT NULL,
    "facility_id" INTEGER NOT NULL,

    CONSTRAINT "alerts_facilities_pkey" PRIMARY KEY ("alert_id","facility_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "alerts_groups" (
    "alert_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "alerts_groups_pkey" PRIMARY KEY ("alert_id","group_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "alerts_subdomains" (
    "alert_id" INTEGER NOT NULL,
    "subdomain" VARCHAR NOT NULL,

    CONSTRAINT "alerts_subdomains_pkey" PRIMARY KEY ("alert_id","subdomain")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "entities" (
    "id" SERIAL NOT NULL,
    "entity_type" "entity_types",
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "facilities" (
    "jstor_id" VARCHAR NOT NULL,
    "id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_facilities" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "features" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "display_name" VARCHAR NOT NULL,
    "category" VARCHAR NOT NULL,
    "description" TEXT NOT NULL,
    "is_protected" BOOLEAN NOT NULL,
    "is_admin_only" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "features_groups_entities" (
    "group_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_groups_entities_pkey" PRIMARY KEY ("group_id","entity_id","feature_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "groups_entities" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "role" "user_roles",
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_entities_pkey" PRIMARY KEY ("group_id","entity_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "globally_restricted_items" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "jstor_item_id" VARCHAR NOT NULL,
    "reason" TEXT NOT NULL,
    "is_restricted" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "globally_restricted_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ip_bypass" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER,
    "ip" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_bypass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "status_details" (
    "id" SERIAL NOT NULL,
    "status_id" INTEGER,
    "type" VARCHAR,
    "detail" TEXT,

    CONSTRAINT "status_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "statuses" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER,
    "jstor_item_id" VARCHAR,
    "jstor_item_type" "jstor_types",
    "status" "status_options",
    "group_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subdomains" (
    "id" SERIAL NOT NULL,
    "subdomain" VARCHAR NOT NULL,
    "entity_type" "entity_types" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdomains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subdomains_facilities" (
    "subdomain" VARCHAR NOT NULL,
    "sitecode" VARCHAR NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdomains_facilities_pkey" PRIMARY KEY ("subdomain","sitecode")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ungrouped_features" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "display_name" VARCHAR NOT NULL,
    "category" VARCHAR NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ungrouped_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "ungrouped_features_entities" (
    "id" SERIAL NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ungrouped_features_entities_pkey" PRIMARY KEY ("feature_id","entity_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "jstor_id" VARCHAR NOT NULL,
    "id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "wordnik_ahd_5_headwords" (
    "headword" VARCHAR NOT NULL,
    "has_pronunciation" BOOLEAN NOT NULL DEFAULT false,
    "has_etymology" BOOLEAN NOT NULL DEFAULT false,
    "frequency" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "wordnik_ahd_5_headwords_pkey" PRIMARY KEY ("headword")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "globally_restricted_items_jstor_item_id_key" ON "globally_restricted_items"("jstor_item_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "globally_restricted_items_id_jstor_item_id_reason_is_restri_idx" ON "globally_restricted_items"("id", "jstor_item_id", "reason", "is_restricted");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "facilities_jstor_id_uq" ON "facilities"("jstor_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "features_name_key" ON "features"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "features_display_name_key" ON "features"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "groups_name_uq" ON "groups"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "groups_entities_id_group_id_entity_id_idx" ON "groups_entities"("id", "group_id", "entity_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "groups_entitites_id_group_id_entity_id_idx" ON "groups_entities"("id", "group_id", "entity_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "statuses_id_jstor_item_id_jstor_item_type_status_group_idx" ON "statuses"("id", "jstor_item_id", "jstor_item_type", "status", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subdomains_subdomain_key" ON "subdomains"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ungrouped_features_name_key" ON "ungrouped_features"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ungrouped_features_display_name_key" ON "ungrouped_features"("display_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ungrouped_features_entities_id_feature_id_entity_id_idx" ON "ungrouped_features_entities"("id", "feature_id", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_jstor_id_uq" ON "users"("jstor_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "wordnik_ahd_5_headwords_headword_key" ON "wordnik_ahd_5_headwords"("headword");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wordnik_ahd_5_headwords_headword_idx" ON "wordnik_ahd_5_headwords"("headword");

-- Create Constraint Adder Function
CREATE OR REPLACE FUNCTION create_constraint_if_not_exists (t_name text, c_name text, constraint_sql text)
  RETURNS void
AS
$BODY$
  BEGIN
    -- Look for our constraint
    IF NOT EXISTS (SELECT constraint_name
                   FROM information_schema.constraint_column_usage
                   WHERE constraint_name = c_name) THEN
        EXECUTE 'ALTER TABLE ' || t_name || ' ADD CONSTRAINT ' || c_name || ' ' || constraint_sql;
    END IF;
  END;
$BODY$
LANGUAGE plpgsql VOLATILE;

-- AddForeignKey
SELECT create_constraint_if_not_exists('targeted_alerts', 'targeted_alerts_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_facilities', 'alerts_facilities_alert_id_fkey', 'FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_facilities', 'alerts_facilities_facility_id_fkey', 'FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_groups', 'alerts_groups_alert_id_fkey', 'FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_groups', 'alerts_groups_group_id_fkey', 'FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_subdomains', 'alerts_subdomains_alert_id_fkey', 'FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('alerts_subdomains', 'alerts_subdomains_subdomain_fkey', 'FOREIGN KEY ("subdomain") REFERENCES "subdomains"("subdomain") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('globally_restricted_items', 'globally_restricted_items_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('facilities', 'facilities_id_fkey', 'FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('features_groups_entities', 'features_groups_entities_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('features_groups_entities', 'features_groups_entities_feature_id_fkey', 'FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('features_groups_entities', 'features_groups_entities_group_id_fkey', 'FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('groups_entities', 'groups_entities_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('groups_entities', 'groups_entities_group_id_fkey', 'FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('ip_bypass', 'ip_bypass_facility_id_fkey', 'FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('status_details', 'status_details_status_id_fkey', 'FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('statuses', 'statuses_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('statuses', 'statuses_group_fkey', 'FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('subdomains_facilities', 'subdomains_facilities_facility_id_fkey', 'FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('subdomains_facilities', 'subdomains_facilities_subdomain_fkey', 'FOREIGN KEY ("subdomain") REFERENCES "subdomains"("subdomain") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('ungrouped_features_entities', 'ungrouped_features_entities_entity_id_fkey', 'FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('ungrouped_features_entities', 'ungrouped_features_entities_feature_id_fkey', 'FOREIGN KEY ("feature_id") REFERENCES "ungrouped_features"("id") ON DELETE CASCADE ON UPDATE NO ACTION');

-- AddForeignKey
SELECT create_constraint_if_not_exists('users', 'users_id_fkey', 'FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION');
