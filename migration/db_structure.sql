-- Dumped from database version 16.6
-- Dumped by pg_dump version 16.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: entity_types; Type: TYPE; Schema: public; Owner: masterpostgresuser
--

CREATE TYPE public.entity_types AS ENUM (
    'programs',
    'users',
    'facilities'
);


ALTER TYPE public.entity_types OWNER TO masterpostgresuser;

--
-- Name: jstor_types; Type: TYPE; Schema: public; Owner: masterpostgresuser
--

CREATE TYPE public.jstor_types AS ENUM (
    'doi',
    'headid',
    'discipline'
);


ALTER TYPE public.jstor_types OWNER TO masterpostgresuser;

--
-- Name: status_options; Type: TYPE; Schema: public; Owner: masterpostgresuser
--

CREATE TYPE public.status_options AS ENUM (
    'Pending',
    'Approved',
    'Denied',
    'Incomplete'
);


ALTER TYPE public.status_options OWNER TO masterpostgresuser;

--
-- Name: user_roles; Type: TYPE; Schema: public; Owner: masterpostgresuser
--

CREATE TYPE public.user_roles AS ENUM (
    'admin',
    'user',
    'removed'
);


ALTER TYPE public.user_roles OWNER TO masterpostgresuser;

--
-- Name: add_admin_to_active_groups(integer); Type: PROCEDURE; Schema: public; Owner: masterpostgresuser
--

CREATE PROCEDURE public.add_admin_to_active_groups(IN uid integer)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    gid INT;
  BEGIN
  FOR gid IN SELECT id FROM groups WHERE is_active=true
  LOOP
    CALL add_group_admin(uid, gid);
  END LOOP;
END; $$;


ALTER PROCEDURE public.add_admin_to_active_groups(IN uid integer) OWNER TO masterpostgresuser;

--
-- Name: add_facilities(json, boolean); Type: PROCEDURE; Schema: public; Owner: masterpostgresuser
--

CREATE PROCEDURE public.add_facilities(IN fac json, IN is_manager boolean)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    primary_sitename VARCHAR;
    sd VARCHAR;
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    ufname VARCHAR;
    ufdetails JSON;
    g RECORD;
    e RECORD;
  BEGIN
    primary_sitename:=fac->>'primary_sitecode';
    sd:=fac->>'subdomain';

    INSERT INTO entities (entity_type, name) VALUES ('facilities', fac->>'name') RETURNING id INTO e;
    INSERT INTO facilities (jstor_id, id) VALUES (fac->>'contact', e.id);

    IF is_manager THEN
      FOR ufname, ufdetails IN SELECT * FROM json_each(fac->'ungrouped_features') WHERE json_typeof(fac->'ungrouped_features')='object'
      LOOP
        fenabled:=(ufdetails->>'enabled'); 
        INSERT INTO ungrouped_features_entities (entity_id, feature_id, enabled) 
        VALUES (e.id, (SELECT id FROM ungrouped_features WHERE name=ufname), fenabled)
        ON CONFLICT (entity_id, feature_id) DO UPDATE
        SET enabled=fenabled, updated_at=DEFAULT;
      END LOOP;
    END IF;

    IF 
      primary_sitename IS NOT NULL 
      AND primary_sitename!='' 
      AND sd IS NOT NULL
      AND sd!=''
    THEN
      INSERT INTO subdomains_facilities (subdomain, facility_id, sitecode) VALUES (sd, e.id, primary_sitename)
      ON CONFLICT (subdomain, sitecode) DO UPDATE
      SET sitecode=primary_sitename, subdomain=sd, updated_at=DEFAULT;
    ELSE
      DELETE FROM subdomains_facilities WHERE facility_id=e.id;
    END IF;

    FOR g IN (SELECT * FROM json_to_recordset(fac->'groups') AS grp(id INT, features JSON))
    LOOP
      INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, e.id, 'user');
      FOR fid, fname IN SELECT id, name FROM features
        LOOP
        IF EXISTS (SELECT value FROM json_each(g.features) WHERE key=fname) 
        THEN
          SELECT value INTO fenabled FROM json_each(g.features) WHERE key=fname LIMIT 1;
        ELSE 
          fenabled:=false;
        END IF;
        INSERT INTO features_groups_entities (group_id, entity_id, feature_id, enabled) 
        VALUES (
          g.id,
          e.id,
          fid,
          fenabled
        );
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.add_facilities(IN fac json, IN is_manager boolean) OWNER TO masterpostgresuser;

--
-- Name: add_users(json, boolean); Type: PROCEDURE; Schema: public; Owner: masterpostgresuser
--

CREATE PROCEDURE public.add_users(IN usr json, IN is_manager boolean)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    ufname VARCHAR;
    ufdetails JSON;
    g RECORD;
    e RECORD;
  BEGIN
    INSERT INTO entities (entity_type, name) VALUES ('users', usr->>'name') RETURNING id INTO e;
    INSERT INTO users (jstor_id, id) VALUES (usr->>'contact', e.id);

    IF is_manager THEN
      FOR ufname, ufdetails IN SELECT * FROM json_each(usr->'ungrouped_features') WHERE json_typeof(usr->'ungrouped_features')='object'
      LOOP
        fenabled:=(ufdetails->>'enabled'); 
        INSERT INTO ungrouped_features_entities (entity_id, feature_id, enabled) 
        VALUES (e.id, (SELECT id FROM ungrouped_features WHERE name=ufname), fenabled)
        ON CONFLICT (entity_id, feature_id) DO UPDATE
        SET enabled=fenabled, updated_at=DEFAULT;
      END LOOP;
    END IF;


    FOR g IN (SELECT * FROM json_to_recordset(usr->'groups') AS grp(id INT, features JSON))
    LOOP
      INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, e.id, 'admin');
      FOR fid, fname IN SELECT id, name FROM features
        LOOP
        IF EXISTS (SELECT value FROM json_each(g.features) WHERE key=fname) 
        THEN
          SELECT value INTO fenabled FROM json_each(g.features) WHERE key=fname LIMIT 1;
        ELSE 
          fenabled:=false;
        END IF;
        INSERT INTO features_groups_entities (group_id, entity_id, feature_id, enabled) 
        VALUES (
          g.id,
          e.id,
          fid,
          fenabled
        );
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.add_users(IN usr json, IN is_manager boolean) OWNER TO masterpostgresuser;

--
-- Name: edit_facilities(json, boolean); Type: PROCEDURE; Schema: public; Owner: masterpostgresuser
--

CREATE PROCEDURE public.edit_facilities(IN fac json, IN is_manager boolean)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    g RECORD;
    fac_id INT;
    sitename VARCHAR;
    facility_name VARCHAR;
    primary_sitename VARCHAR;
    sd VARCHAR;
    c INT;
    n INT;
    fname VARCHAR;
    fenabled BOOLEAN;
    ufname VARCHAR;
    ufdetails JSON;
    ufenabled BOOLEAN;
    fid INT;
    r RECORD;
  BEGIN
    fac_id:=(fac->>'id')::INT;
    sitename:=fac->>'contact';
    facility_name:=fac->>'name';
    primary_sitename:=fac->>'primary_sitecode';
    sd:=fac->>'subdomain';
    IF fac_id=0 THEN
      SELECT id INTO fac_id FROM facilities WHERE jstor_id=sitename;
    END IF;
    SELECT * INTO r FROM facilities WHERE id = fac_id;
    IF r.jstor_id!=sitename THEN
      UPDATE facilities SET jstor_id=sitename, updated_at=DEFAULT WHERE id = fac_id;
    END IF;
    SELECT * INTO r FROM entities WHERE id = fac_id;
    IF r.name!=facility_name THEN
      UPDATE entities SET name=facility_name, updated_at=DEFAULT WHERE id = fac_id;
    END IF;

    IF is_manager THEN
      FOR ufname, ufdetails IN SELECT * FROM json_each(fac->'ungrouped_features') WHERE json_typeof(fac->'ungrouped_features')='object'
      LOOP
        fenabled:=(ufdetails->>'enabled'); 
        INSERT INTO ungrouped_features_entities (entity_id, feature_id, enabled) 
        VALUES (user_id, (SELECT id FROM ungrouped_features WHERE name=ufname), fenabled)
        ON CONFLICT (entity_id, feature_id) DO UPDATE
        SET enabled=fenabled, updated_at=DEFAULT;
      END LOOP;
    END IF;

    IF 
      primary_sitename IS NOT NULL 
      AND primary_sitename!='' 
      AND sd IS NOT NULL
      AND sd!=''
    THEN
      INSERT INTO subdomains_facilities (subdomain, facility_id, sitecode) VALUES (sd, fac_id, primary_sitename)
      ON CONFLICT (subdomain, sitecode) DO UPDATE
      SET sitecode=primary_sitename, subdomain=sd, updated_at=DEFAULT;
    ELSE
      DELETE FROM subdomains_facilities WHERE facility_id=fac_id;
    END IF;


    FOR g IN (SELECT * FROM json_to_recordset(fac->'groups') AS grp(id INT, features JSON))
    LOOP
      SELECT COUNT(id) INTO c FROM groups_entities WHERE group_id=g.id AND entity_id=fac_id;
      SELECT COUNT(id) INTO n FROM groups_entities WHERE group_id=g.id AND entity_id=fac_id AND role='user';
      IF c = 0 AND n = 0 THEN
        INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, fac_id, 'user');
      ELSIF n = 0 THEN
        UPDATE groups_entities SET role='user', updated_at=DEFAULT WHERE group_id=g.id AND entity_id=fac_id;
      END IF;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        SELECT COUNT(feature_id) INTO c FROM features_groups_entities WHERE group_id=g.id AND entity_id=fac_id AND feature_id=fid;
        IF c = 0 THEN
          INSERT INTO features_groups_entities(group_id, entity_id, feature_id, enabled) VALUES (g.id, fac_id, fid, fenabled);
        ELSE 
          UPDATE features_groups_entities
          SET enabled = fenabled, updated_at=DEFAULT 
          WHERE group_id=g.id AND entity_id=fac_id AND feature_id=fid;
        END IF;
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.edit_facilities(IN fac json, IN is_manager boolean) OWNER TO masterpostgresuser;

--
-- Name: edit_users(json, boolean); Type: PROCEDURE; Schema: public; Owner: masterpostgresuser
--

CREATE PROCEDURE public.edit_users(IN usr json, IN is_manager boolean)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    g RECORD;
    uf RECORD;
    user_id INT;
    email VARCHAR;
    user_name VARCHAR;
    c INT;
    n INT;
    fname VARCHAR;
    fenabled BOOLEAN;
    ufname VARCHAR;
    ufdetails JSON;
    ufenabled BOOLEAN;
    fid INT;
    r RECORD;
  BEGIN
    user_id:=(usr->>'id')::INT;
    email:=usr->>'contact';
    user_name:=usr->>'name';
    IF user_id=0 THEN
      SELECT id INTO user_id FROM users WHERE jstor_id=email;
    END IF;
    SELECT * INTO r FROM users WHERE id = user_id;
    IF r.jstor_id!=email THEN
      UPDATE users SET jstor_id=email, updated_at=DEFAULT WHERE id = user_id;
    END IF;
    SELECT * INTO r FROM entities WHERE id = user_id;
    IF r.name!=user_name THEN
      UPDATE entities SET name=user_name, updated_at=DEFAULT WHERE id = user_id;
    END IF;

    IF  is_manager THEN
      FOR ufname, ufdetails IN SELECT * FROM json_each(usr->'ungrouped_features') WHERE json_typeof(usr->'ungrouped_features')='object'
      LOOP
        RAISE NOTICE 'Ungrouped feature: %', ufname;
        fenabled:=(ufdetails->>'enabled'); 
        INSERT INTO ungrouped_features_entities (entity_id, feature_id, enabled) 
        VALUES (user_id, (SELECT id FROM ungrouped_features WHERE name=ufname AND is_active=true), fenabled)
        ON CONFLICT (feature_id, entity_id) DO UPDATE
        SET enabled=fenabled, updated_at=DEFAULT;
      END LOOP;
    END IF;
    
    FOR g IN (SELECT * FROM json_to_recordset(usr->'groups') AS grp(id INT, features JSON))
    LOOP
      SELECT COUNT(id) INTO c FROM groups_entities WHERE group_id=g.id AND entity_id=user_id;
      SELECT COUNT(id) INTO n FROM groups_entities WHERE group_id=g.id AND entity_id=user_id AND role='admin';
      IF c = 0 AND n = 0 THEN
        INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, user_id, 'admin');
      ELSIF n = 0 THEN
        UPDATE groups_entities SET role='admin', updated_at=DEFAULT WHERE group_id=g.id AND entity_id=user_id;
      END IF;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        SELECT COUNT(feature_id) INTO c FROM features_groups_entities WHERE group_id=g.id AND entity_id=user_id AND feature_id=fid;
        IF c = 0 THEN
          INSERT INTO features_groups_entities(group_id, entity_id, feature_id, enabled) VALUES (g.id, user_id, fid, fenabled);
        ELSE 
          UPDATE features_groups_entities
          SET enabled = fenabled, updated_at=DEFAULT 
          WHERE group_id=g.id AND entity_id=user_id AND feature_id=fid;
        END IF;
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.edit_users(IN usr json, IN is_manager boolean) OWNER TO masterpostgresuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: jaip_writer
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO jaip_writer;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    text text NOT NULL,
    status character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (CURRENT_DATE + '7 days'::interval)
);


ALTER TABLE public.alerts OWNER TO masterpostgresuser;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO masterpostgresuser;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: entities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.entities (
    id integer NOT NULL,
    entity_type public.entity_types,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.entities OWNER TO masterpostgresuser;

--
-- Name: entities_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.entities_id_seq OWNER TO masterpostgresuser;

--
-- Name: entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.entities_id_seq OWNED BY public.entities.id;


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.facilities (
    jstor_id character varying NOT NULL,
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.facilities OWNER TO masterpostgresuser;

--
-- Name: features; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.features (
    id integer NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    display_name character varying NOT NULL,
    category character varying NOT NULL,
    description text NOT NULL,
    is_protected boolean NOT NULL,
    is_admin_only boolean NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.features OWNER TO masterpostgresuser;

--
-- Name: features_groups_entities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.features_groups_entities (
    group_id integer NOT NULL,
    entity_id integer NOT NULL,
    feature_id integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.features_groups_entities OWNER TO masterpostgresuser;

--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.features_id_seq OWNER TO masterpostgresuser;

--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: groups; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.groups OWNER TO masterpostgresuser;

--
-- Name: groups_entities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.groups_entities (
    id integer NOT NULL,
    group_id integer NOT NULL,
    entity_id integer NOT NULL,
    role public.user_roles,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.groups_entities OWNER TO masterpostgresuser;

--
-- Name: groups_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.groups_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_entities_id_seq OWNER TO masterpostgresuser;

--
-- Name: groups_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.groups_entities_id_seq OWNED BY public.groups_entities.id;


--
-- Name: groups_entitites_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.groups_entitites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_entitites_id_seq OWNER TO masterpostgresuser;

--
-- Name: groups_entitites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.groups_entitites_id_seq OWNED BY public.groups_entities.id;


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.groups_id_seq OWNER TO masterpostgresuser;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: ip_bypass; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.ip_bypass (
    id integer NOT NULL,
    facility_id integer,
    ip character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ip_bypass OWNER TO masterpostgresuser;

--
-- Name: ip_bypass_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.ip_bypass_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ip_bypass_id_seq OWNER TO masterpostgresuser;

--
-- Name: ip_bypass_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.ip_bypass_id_seq OWNED BY public.ip_bypass.id;


--
-- Name: status_details; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.status_details (
    id integer NOT NULL,
    status_id integer,
    type character varying,
    detail text
);


ALTER TABLE public.status_details OWNER TO masterpostgresuser;

--
-- Name: status_details_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.status_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.status_details_id_seq OWNER TO masterpostgresuser;

--
-- Name: status_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.status_details_id_seq OWNED BY public.status_details.id;


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.statuses (
    id integer NOT NULL,
    entity_id integer,
    jstor_item_id character varying,
    jstor_item_type public.jstor_types,
    status public.status_options,
    group_id integer,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.statuses OWNER TO masterpostgresuser;

--
-- Name: statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.statuses_id_seq OWNER TO masterpostgresuser;

--
-- Name: statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.statuses_id_seq OWNED BY public.statuses.id;


--
-- Name: subdomains; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.subdomains (
    id integer NOT NULL,
    subdomain character varying NOT NULL,
    entity_type public.entity_types NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subdomains OWNER TO masterpostgresuser;

--
-- Name: subdomains_facilities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.subdomains_facilities (
    subdomain character varying NOT NULL,
    sitecode character varying NOT NULL,
    facility_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subdomains_facilities OWNER TO masterpostgresuser;

--
-- Name: subdomains_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.subdomains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subdomains_id_seq OWNER TO masterpostgresuser;

--
-- Name: subdomains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.subdomains_id_seq OWNED BY public.subdomains.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    token character varying NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tokens OWNER TO masterpostgresuser;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_id_seq OWNER TO masterpostgresuser;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: ungrouped_features; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.ungrouped_features (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    category character varying NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.ungrouped_features OWNER TO masterpostgresuser;

--
-- Name: ungrouped_features_entities; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.ungrouped_features_entities (
    id integer NOT NULL,
    feature_id integer NOT NULL,
    entity_id integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ungrouped_features_entities OWNER TO masterpostgresuser;

--
-- Name: ungrouped_features_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.ungrouped_features_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ungrouped_features_entities_id_seq OWNER TO masterpostgresuser;

--
-- Name: ungrouped_features_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.ungrouped_features_entities_id_seq OWNED BY public.ungrouped_features_entities.id;


--
-- Name: ungrouped_features_id_seq; Type: SEQUENCE; Schema: public; Owner: masterpostgresuser
--

CREATE SEQUENCE public.ungrouped_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ungrouped_features_id_seq OWNER TO masterpostgresuser;

--
-- Name: ungrouped_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: masterpostgresuser
--

ALTER SEQUENCE public.ungrouped_features_id_seq OWNED BY public.ungrouped_features.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: masterpostgresuser
--

CREATE TABLE public.users (
    jstor_id character varying NOT NULL,
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO masterpostgresuser;
