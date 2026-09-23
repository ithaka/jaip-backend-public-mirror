-- AlterEnum
ALTER TYPE "status_options" ADD VALUE 'Suspended';

-- CreateTable
CREATE TABLE "request_permissions" (
    "id" SERIAL NOT NULL,
    "facility_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "request_permissions_facility_id_key" ON "request_permissions"("facility_id");

-- AddForeignKey
ALTER TABLE "request_permissions" ADD CONSTRAINT "request_permissions_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "request_permissions" ADD CONSTRAINT "request_permissions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
