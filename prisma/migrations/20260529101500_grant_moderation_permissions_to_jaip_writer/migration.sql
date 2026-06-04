-- Grant jaip_writer full DML access to moderation tables and usage on related sequences.
GRANT USAGE ON SCHEMA public TO jaip_writer;

-- Table privileges (SELECT, INSERT, UPDATE, DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_entries TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_entry_disciplines TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_entry_disc_codes TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_images TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_flagged_image_categories TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_flagged_text_pages TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_flagged_text_snippets TO jaip_writer;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.moderation_pipeline_errors TO jaip_writer;

-- Sequence privileges (SELECT, USAGE)
GRANT SELECT, USAGE ON SEQUENCE public.moderation_entry_disciplines_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_entry_disc_codes_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_images_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_flagged_image_categories_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_flagged_text_pages_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_flagged_text_snippets_id_seq TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_pipeline_errors_id_seq TO jaip_writer;

-- Enum type used by moderation_entries.review_status
GRANT USAGE ON TYPE public.review_status TO jaip_writer;
