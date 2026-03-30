-- PERMISSIONS
-- Alerts
GRANT SELECT ON TABLE public.alerts TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.alerts_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alerts_facilities TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alerts_groups TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.alerts_subdomains TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.targeted_alerts TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.targeted_alerts_id_seq TO jaip_writer;

-- Authentication
GRANT SELECT ON TABLE public.ip_bypass TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.ip_bypass_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains_facilities TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.subdomains_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tokens TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.tokens_id_seq TO jaip_writer;

-- Dictionary
GRANT SELECT ON TABLE public.wordnik_ahd_5_headwords TO jaip_writer;

-- Entities
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.entities TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.entities_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.facilities TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO jaip_writer;

-- Features
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features_groups_entities TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.features_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features_entities TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_entities_id_seq TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_id_seq TO jaip_writer;

-- Groups
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups_entities TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.groups_entities_id_seq TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.groups_id_seq TO jaip_writer;

-- Statuses
GRANT SELECT,INSERT,UPDATE ON TABLE public.globally_restricted_items TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.globally_restricted_items_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.status_details TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.status_details_id_seq TO jaip_writer;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.statuses TO jaip_writer;
GRANT SELECT,USAGE ON SEQUENCE public.statuses_id_seq TO jaip_writer;

