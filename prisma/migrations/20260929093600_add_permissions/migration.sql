-- Statuses
GRANT
SELECT
,
INSERT
,
UPDATE
  ON TABLE public.request_permissions TO jaip_writer;

GRANT
SELECT
,
  USAGE ON SEQUENCE public.request_permissions_id_seq TO jaip_writer;