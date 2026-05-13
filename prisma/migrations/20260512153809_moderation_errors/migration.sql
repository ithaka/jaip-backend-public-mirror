-- CreateTable
CREATE TABLE "moderation_pipeline_errors" (
    "id" BIGSERIAL NOT NULL,
    "job_id" UUID NOT NULL,
    "iid" TEXT,
    "stage" TEXT,
    "error" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_pipeline_errors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_pipeline_errors_job_id_iid_idx" ON "moderation_pipeline_errors"("job_id", "iid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wordnik_ahd_5_headwords_headword_trgm_idx" ON "wordnik_ahd_5_headwords" USING GIN ("headword" gin_trgm_ops);
