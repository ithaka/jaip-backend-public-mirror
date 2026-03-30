-- PRISMA MIGRATION DATA
-- This is manually added to the prisma migration file to ensure that the pg_trgm extension is 
-- created before any tables or indexes that depend on it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "alert_statuses" AS ENUM ('info', 'warning', 'error', 'success');

-- CreateEnum
CREATE TYPE "entity_types" AS ENUM ('programs', 'users', 'facilities');

-- CreateEnum
CREATE TYPE "jstor_types" AS ENUM ('doi', 'headid', 'discipline');

-- CreateEnum
CREATE TYPE "status_options" AS ENUM ('Pending', 'Approved', 'Denied', 'Incomplete');

-- CreateEnum
CREATE TYPE "user_roles" AS ENUM ('admin', 'user', 'removed');

-- CreateTable
CREATE TABLE "alerts" (
    "id" SERIAL NOT NULL,
    "text" TEXT NOT NULL,
    "status" "alert_statuses" NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) DEFAULT (CURRENT_DATE + '7 days'::interval),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targeted_alerts" (
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
CREATE TABLE "alerts_facilities" (
    "alert_id" INTEGER NOT NULL,
    "facility_id" INTEGER NOT NULL,

    CONSTRAINT "alerts_facilities_pkey" PRIMARY KEY ("alert_id","facility_id")
);

-- CreateTable
CREATE TABLE "alerts_groups" (
    "alert_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "alerts_groups_pkey" PRIMARY KEY ("alert_id","group_id")
);

-- CreateTable
CREATE TABLE "alerts_subdomains" (
    "alert_id" INTEGER NOT NULL,
    "subdomain" VARCHAR NOT NULL,

    CONSTRAINT "alerts_subdomains_pkey" PRIMARY KEY ("alert_id","subdomain")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" SERIAL NOT NULL,
    "entity_type" "entity_types",
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facilities" (
    "jstor_id" VARCHAR NOT NULL,
    "id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_facilities" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
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
CREATE TABLE "features_groups_entities" (
    "group_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "features_groups_entities_pkey" PRIMARY KEY ("group_id","entity_id","feature_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups_entities" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "role" "user_roles",
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_entities_pkey" PRIMARY KEY ("group_id","entity_id")
);

-- CreateTable
CREATE TABLE "globally_restricted_items" (
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
CREATE TABLE "ip_bypass" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER,
    "ip" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_bypass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_details" (
    "id" SERIAL NOT NULL,
    "status_id" INTEGER,
    "type" VARCHAR,
    "detail" TEXT,

    CONSTRAINT "status_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
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
CREATE TABLE "subdomains" (
    "id" SERIAL NOT NULL,
    "subdomain" VARCHAR NOT NULL,
    "entity_type" "entity_types" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdomains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subdomains_facilities" (
    "subdomain" VARCHAR NOT NULL,
    "sitecode" VARCHAR NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subdomains_facilities_pkey" PRIMARY KEY ("subdomain","sitecode")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ungrouped_features" (
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
CREATE TABLE "ungrouped_features_entities" (
    "id" SERIAL NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "enabled" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ungrouped_features_entities_pkey" PRIMARY KEY ("feature_id","entity_id")
);

-- CreateTable
CREATE TABLE "users" (
    "jstor_id" VARCHAR NOT NULL,
    "id" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk_users" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordnik_ahd_5_headwords" (
    "headword" VARCHAR NOT NULL,
    "has_pronunciation" BOOLEAN NOT NULL DEFAULT false,
    "has_etymology" BOOLEAN NOT NULL DEFAULT false,
    "frequency" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "wordnik_ahd_5_headwords_pkey" PRIMARY KEY ("headword")
);

-- CreateIndex
CREATE UNIQUE INDEX "globally_restricted_items_jstor_item_id_key" ON "globally_restricted_items"("jstor_item_id");

-- CreateIndex
CREATE INDEX "globally_restricted_items_id_jstor_item_id_reason_is_restri_idx" ON "globally_restricted_items"("id", "jstor_item_id", "reason", "is_restricted");

-- CreateIndex
CREATE UNIQUE INDEX "facilities_jstor_id_uq" ON "facilities"("jstor_id");

-- CreateIndex
CREATE UNIQUE INDEX "features_name_key" ON "features"("name");

-- CreateIndex
CREATE UNIQUE INDEX "features_display_name_key" ON "features"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "groups_name_uq" ON "groups"("name");

-- CreateIndex
CREATE INDEX "groups_entities_id_group_id_entity_id_idx" ON "groups_entities"("id", "group_id", "entity_id");

-- CreateIndex
CREATE INDEX "groups_entitites_id_group_id_entity_id_idx" ON "groups_entities"("id", "group_id", "entity_id");

-- CreateIndex
CREATE INDEX "statuses_id_jstor_item_id_jstor_item_type_status_group_idx" ON "statuses"("id", "jstor_item_id", "jstor_item_type", "status", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "subdomains_subdomain_key" ON "subdomains"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "ungrouped_features_name_key" ON "ungrouped_features"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ungrouped_features_display_name_key" ON "ungrouped_features"("display_name");

-- CreateIndex
CREATE INDEX "ungrouped_features_entities_id_feature_id_entity_id_idx" ON "ungrouped_features_entities"("id", "feature_id", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_jstor_id_uq" ON "users"("jstor_id");

-- CreateIndex
CREATE INDEX "wordnik_ahd_5_headwords_headword_idx" ON "wordnik_ahd_5_headwords"("headword");

-- CreateIndex
CREATE UNIQUE INDEX "wordnik_ahd_5_headwords_headword_key" ON "wordnik_ahd_5_headwords"("headword");

-- CreateIndex
CREATE INDEX "wordnik_ahd_5_headwords_headword_trgm_idx" ON "wordnik_ahd_5_headwords" USING GIN ("headword" gin_trgm_ops);

-- AddForeignKey
ALTER TABLE "targeted_alerts" ADD CONSTRAINT "targeted_alerts_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_facilities" ADD CONSTRAINT "alerts_facilities_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_facilities" ADD CONSTRAINT "alerts_facilities_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_groups" ADD CONSTRAINT "alerts_groups_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_groups" ADD CONSTRAINT "alerts_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_subdomains" ADD CONSTRAINT "alerts_subdomains_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "targeted_alerts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alerts_subdomains" ADD CONSTRAINT "alerts_subdomains_subdomain_fkey" FOREIGN KEY ("subdomain") REFERENCES "subdomains"("subdomain") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "globally_restricted_items" ADD CONSTRAINT "globally_restricted_items_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "facilities" ADD CONSTRAINT "facilities_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "features_groups_entities" ADD CONSTRAINT "features_groups_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "features_groups_entities" ADD CONSTRAINT "features_groups_entities_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "features_groups_entities" ADD CONSTRAINT "features_groups_entities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "groups_entities" ADD CONSTRAINT "groups_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "groups_entities" ADD CONSTRAINT "groups_entities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ip_bypass" ADD CONSTRAINT "ip_bypass_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "status_details" ADD CONSTRAINT "status_details_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_group_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subdomains_facilities" ADD CONSTRAINT "subdomains_facilities_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subdomains_facilities" ADD CONSTRAINT "subdomains_facilities_subdomain_fkey" FOREIGN KEY ("subdomain") REFERENCES "subdomains"("subdomain") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ungrouped_features_entities" ADD CONSTRAINT "ungrouped_features_entities_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ungrouped_features_entities" ADD CONSTRAINT "ungrouped_features_entities_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "ungrouped_features"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "entities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
