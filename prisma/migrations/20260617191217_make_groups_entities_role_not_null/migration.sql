/*
  Warnings:

  - Made the column `role` on table `groups_entities` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "groups_entities" ALTER COLUMN "role" SET NOT NULL;
