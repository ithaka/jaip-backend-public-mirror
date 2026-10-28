-- CreateTable
CREATE TABLE "global_approvals" (
    "id" SERIAL NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_approvals_group_id_key" ON "global_approvals"("group_id");

-- CreateIndex
CREATE INDEX "global_approvals_id_group_id_idx" ON "global_approvals"("id", "group_id");

-- AddForeignKey
ALTER TABLE "global_approvals" ADD CONSTRAINT "global_approvals_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "entities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "global_approvals" ADD CONSTRAINT "global_approvals_group_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Grant jaip_writer the privileges required to read and update global approvals.
GRANT SELECT, INSERT, UPDATE ON TABLE public.global_approvals TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.global_approvals_id_seq TO jaip_writer;
