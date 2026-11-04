CREATE INDEX CONCURRENTLY "statuses_bulk_lookup_idx"
ON "statuses" ("jstor_item_type", "group_id", "jstor_item_id", "id" DESC);