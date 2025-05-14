
--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: entities id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.entities ALTER COLUMN id SET DEFAULT nextval('public.entities_id_seq'::regclass);


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: groups_entities id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups_entities ALTER COLUMN id SET DEFAULT nextval('public.groups_entities_id_seq'::regclass);


--
-- Name: ip_bypass id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ip_bypass ALTER COLUMN id SET DEFAULT nextval('public.ip_bypass_id_seq'::regclass);


--
-- Name: status_details id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.status_details ALTER COLUMN id SET DEFAULT nextval('public.status_details_id_seq'::regclass);


--
-- Name: statuses id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.statuses ALTER COLUMN id SET DEFAULT nextval('public.statuses_id_seq'::regclass);


--
-- Name: subdomains id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains ALTER COLUMN id SET DEFAULT nextval('public.subdomains_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: ungrouped_features id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features ALTER COLUMN id SET DEFAULT nextval('public.ungrouped_features_id_seq'::regclass);


--
-- Name: ungrouped_features_entities id; Type: DEFAULT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features_entities ALTER COLUMN id SET DEFAULT nextval('public.ungrouped_features_entities_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: jaip_writer
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_jstor_id_uq; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_jstor_id_uq UNIQUE (jstor_id);


--
-- Name: features features_display_name_key; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_display_name_key UNIQUE (display_name);


--
-- Name: features_groups_entities features_groups_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features_groups_entities
    ADD CONSTRAINT features_groups_entities_pkey PRIMARY KEY (group_id, entity_id, feature_id);


--
-- Name: features features_name_key; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_name_key UNIQUE (name);


--
-- Name: features features_name_uq; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_name_uq UNIQUE (name);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: groups_entities groups_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entities_pkey PRIMARY KEY (group_id, entity_id);


--
-- Name: groups groups_name_uq; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_name_uq UNIQUE (name);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: ip_bypass ip_bypass_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ip_bypass
    ADD CONSTRAINT ip_bypass_pkey PRIMARY KEY (id);


--
-- Name: facilities pk_facilities; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT pk_facilities PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: status_details status_details_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.status_details
    ADD CONSTRAINT status_details_pkey PRIMARY KEY (id);


--
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


--
-- Name: subdomains_facilities subdomains_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_pkey PRIMARY KEY (subdomain, sitecode);


--
-- Name: subdomains subdomains_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains
    ADD CONSTRAINT subdomains_pkey PRIMARY KEY (id);


--
-- Name: subdomains subdomains_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains
    ADD CONSTRAINT subdomains_subdomain_key UNIQUE (subdomain);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: ungrouped_features ungrouped_features_display_name_key; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_display_name_key UNIQUE (display_name);


--
-- Name: ungrouped_features_entities ungrouped_features_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_pkey PRIMARY KEY (feature_id, entity_id);


--
-- Name: ungrouped_features ungrouped_features_name_key; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_name_key UNIQUE (name);


--
-- Name: ungrouped_features ungrouped_features_pkey; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_pkey PRIMARY KEY (id);


--
-- Name: users users_jstor_id_uq; Type: CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_jstor_id_uq UNIQUE (jstor_id);


--
-- Name: groups_entities_id_group_id_entity_id_idx; Type: INDEX; Schema: public; Owner: masterpostgresuser
--

CREATE INDEX groups_entities_id_group_id_entity_id_idx ON public.groups_entities USING btree (id, group_id, entity_id);


--
-- Name: groups_entitites_id_group_id_entity_id_idx; Type: INDEX; Schema: public; Owner: masterpostgresuser
--

CREATE INDEX groups_entitites_id_group_id_entity_id_idx ON public.groups_entities USING btree (id, group_id, entity_id);


--
-- Name: statuses_id_jstor_item_id_jstor_item_type_status_group_idx; Type: INDEX; Schema: public; Owner: masterpostgresuser
--

CREATE INDEX statuses_id_jstor_item_id_jstor_item_type_status_group_idx ON public.statuses USING btree (id, jstor_item_id, jstor_item_type, status, group_id);


--
-- Name: ungrouped_features_entities_id_feature_id_entity_id_idx; Type: INDEX; Schema: public; Owner: masterpostgresuser
--

CREATE INDEX ungrouped_features_entities_id_feature_id_entity_id_idx ON public.ungrouped_features_entities USING btree (id, feature_id, entity_id);


--
-- Name: facilities facilities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_id_fkey FOREIGN KEY (id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: features_groups_entities features_groups_entities_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features_groups_entities
    ADD CONSTRAINT features_groups_entities_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: features_groups_entities features_groups_entities_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features_groups_entities
    ADD CONSTRAINT features_groups_entities_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.features(id) ON DELETE CASCADE;


--
-- Name: features_groups_entities features_groups_entities_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.features_groups_entities
    ADD CONSTRAINT features_groups_entities_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: groups_entities groups_entities_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entities_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: groups_entities groups_entities_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entities_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;


--
-- Name: ip_bypass ip_bypass_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ip_bypass
    ADD CONSTRAINT ip_bypass_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;


--
-- Name: status_details status_details_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.status_details
    ADD CONSTRAINT status_details_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.statuses(id) ON DELETE CASCADE;


--
-- Name: statuses statuses_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: statuses statuses_group_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_group_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: subdomains_facilities subdomains_facilities_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE;


--
-- Name: subdomains_facilities subdomains_facilities_subdomain_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_subdomain_fkey FOREIGN KEY (subdomain) REFERENCES public.subdomains(subdomain) ON DELETE CASCADE;


--
-- Name: ungrouped_features_entities ungrouped_features_entities_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: ungrouped_features_entities ungrouped_features_entities_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.ungrouped_features(id) ON DELETE CASCADE;


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: masterpostgresuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES public.entities(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- Name: TABLE alerts; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT ON TABLE public.alerts TO jaip_writer;


--
-- Name: SEQUENCE alerts_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.alerts_id_seq TO jaip_writer;


--
-- Name: TABLE entities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.entities TO jaip_writer;


--
-- Name: SEQUENCE entities_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.entities_id_seq TO jaip_writer;


--
-- Name: TABLE facilities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.facilities TO jaip_writer;


--
-- Name: TABLE features; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features TO jaip_writer;


--
-- Name: TABLE features_groups_entities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features_groups_entities TO jaip_writer;


--
-- Name: SEQUENCE features_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.features_id_seq TO jaip_writer;


--
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups TO jaip_writer;


--
-- Name: TABLE groups_entities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups_entities TO jaip_writer;


--
-- Name: SEQUENCE groups_entities_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.groups_entities_id_seq TO jaip_writer;


--
-- Name: SEQUENCE groups_entitites_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.groups_entitites_id_seq TO jaip_writer;


--
-- Name: SEQUENCE groups_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.groups_id_seq TO jaip_writer;


--
-- Name: TABLE ip_bypass; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT ON TABLE public.ip_bypass TO jaip_writer;


--
-- Name: SEQUENCE ip_bypass_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.ip_bypass_id_seq TO jaip_writer;


--
-- Name: TABLE status_details; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.status_details TO jaip_writer;


--
-- Name: SEQUENCE status_details_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.status_details_id_seq TO jaip_writer;


--
-- Name: TABLE statuses; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.statuses TO jaip_writer;


--
-- Name: SEQUENCE statuses_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.statuses_id_seq TO jaip_writer;


--
-- Name: TABLE subdomains; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains TO jaip_writer;


--
-- Name: TABLE subdomains_facilities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains_facilities TO jaip_writer;


--
-- Name: SEQUENCE subdomains_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.subdomains_id_seq TO jaip_writer;


--
-- Name: TABLE tokens; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tokens TO jaip_writer;


--
-- Name: SEQUENCE tokens_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.tokens_id_seq TO jaip_writer;


--
-- Name: TABLE ungrouped_features; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features TO jaip_writer;


--
-- Name: TABLE ungrouped_features_entities; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features_entities TO jaip_writer;


--
-- Name: SEQUENCE ungrouped_features_entities_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_entities_id_seq TO jaip_writer;


--
-- Name: SEQUENCE ungrouped_features_id_seq; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_id_seq TO jaip_writer;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: masterpostgresuser
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO jaip_writer;


--
-- PostgreSQL database dump complete
--

