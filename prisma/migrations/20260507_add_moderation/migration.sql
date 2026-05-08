-- CreateEnum
CREATE TYPE "review_status" AS ENUM ('waiting_for_review', 'saved_for_later', 'in_cart', 'dismissed', 'restricted', 'unflagged');

-- CreateTable
CREATE TABLE "moderation_entries" (
    "doi" TEXT NOT NULL,
    "iid" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "journal" TEXT,
    "book_title" TEXT,
    "content_type" TEXT,
    "item_type" TEXT,
    "review_status" "review_status",
    "moderation_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_entries_pkey" PRIMARY KEY ("doi")
);

-- CreateTable
CREATE TABLE "moderation_entry_disciplines" (
    "id" BIGSERIAL NOT NULL,
    "entry_doi" TEXT NOT NULL,
    "discipline" TEXT NOT NULL,

    CONSTRAINT "moderation_entry_disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_entry_disc_codes" (
    "id" BIGSERIAL NOT NULL,
    "entry_doi" TEXT NOT NULL,
    "disc_code" TEXT NOT NULL,

    CONSTRAINT "moderation_entry_disc_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_images" (
    "id" BIGSERIAL NOT NULL,
    "entry_doi" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "image_index" INTEGER NOT NULL,
    "is_flagged" BOOLEAN,
    "image_file" TEXT,

    CONSTRAINT "moderation_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flagged_image_categories" (
    "id" BIGSERIAL NOT NULL,
    "image_id" BIGINT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "moderation_flagged_image_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flagged_text_pages" (
    "id" BIGSERIAL NOT NULL,
    "entry_doi" TEXT NOT NULL,
    "page" INTEGER NOT NULL,

    CONSTRAINT "moderation_flagged_text_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flagged_text_snippets" (
    "id" BIGSERIAL NOT NULL,
    "text_page_id" BIGINT NOT NULL,
    "category" TEXT NOT NULL,
    "snippet_text" TEXT NOT NULL,

    CONSTRAINT "moderation_flagged_text_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moderation_entries_iid_key" ON "moderation_entries"("iid");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_entry_disciplines_entry_doi_discipline_key" ON "moderation_entry_disciplines"("entry_doi", "discipline");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_entry_disc_codes_entry_doi_disc_code_key" ON "moderation_entry_disc_codes"("entry_doi", "disc_code");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_images_entry_doi_page_image_index_key" ON "moderation_images"("entry_doi", "page", "image_index");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_flagged_image_categories_image_id_category_key" ON "moderation_flagged_image_categories"("image_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_flagged_text_pages_entry_doi_page_key" ON "moderation_flagged_text_pages"("entry_doi", "page");

-- AddForeignKey
ALTER TABLE "moderation_entry_disciplines" ADD CONSTRAINT "moderation_entry_disciplines_entry_doi_fkey" FOREIGN KEY ("entry_doi") REFERENCES "moderation_entries"("doi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_entry_disc_codes" ADD CONSTRAINT "moderation_entry_disc_codes_entry_doi_fkey" FOREIGN KEY ("entry_doi") REFERENCES "moderation_entries"("doi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_images" ADD CONSTRAINT "moderation_images_entry_doi_fkey" FOREIGN KEY ("entry_doi") REFERENCES "moderation_entries"("doi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flagged_image_categories" ADD CONSTRAINT "moderation_flagged_image_categories_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "moderation_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flagged_text_pages" ADD CONSTRAINT "moderation_flagged_text_pages_entry_doi_fkey" FOREIGN KEY ("entry_doi") REFERENCES "moderation_entries"("doi") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flagged_text_snippets" ADD CONSTRAINT "moderation_flagged_text_snippets_text_page_id_fkey" FOREIGN KEY ("text_page_id") REFERENCES "moderation_flagged_text_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "moderation_entry_disciplines_entry_doi_idx" ON "moderation_entry_disciplines"("entry_doi");

-- CreateIndex
CREATE INDEX "moderation_entry_disc_codes_entry_doi_idx" ON "moderation_entry_disc_codes"("entry_doi");

-- CreateIndex
CREATE INDEX "moderation_images_entry_doi_idx" ON "moderation_images"("entry_doi");

-- CreateIndex
CREATE INDEX "moderation_flagged_image_categories_image_id_idx" ON "moderation_flagged_image_categories"("image_id");

-- CreateIndex
CREATE INDEX "moderation_flagged_text_pages_entry_doi_idx" ON "moderation_flagged_text_pages"("entry_doi");

-- CreateIndex
CREATE INDEX "moderation_flagged_text_snippets_text_page_id_idx" ON "moderation_flagged_text_snippets"("text_page_id");
