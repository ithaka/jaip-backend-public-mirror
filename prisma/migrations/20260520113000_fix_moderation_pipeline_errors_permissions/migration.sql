-- Repair grants for moderation_pipeline_errors.
GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE public.moderation_pipeline_errors TO jaip_writer;
GRANT SELECT, USAGE ON SEQUENCE public.moderation_pipeline_errors_id_seq TO jaip_writer;