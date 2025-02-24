--
-- PostgreSQL database dump
--

-- Dumped from database version 13.12
-- Dumped by pg_dump version 15.6

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

\connect jaip

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: rdsadmin
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO rdsadmin;

--
-- Name: entity_types; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.entity_types AS ENUM (
    'programs',
    'users',
    'facilities'
);


ALTER TYPE public.entity_types OWNER TO postgres;

--
-- Name: jstor_types; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.jstor_types AS ENUM (
    'doi',
    'headid',
    'discipline'
);


ALTER TYPE public.jstor_types OWNER TO postgres;

--
-- Name: status_options; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.status_options AS ENUM (
    'Pending',
    'Approved',
    'Denied',
    'Incomplete'
);


ALTER TYPE public.status_options OWNER TO postgres;

--
-- Name: user_roles; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_roles AS ENUM (
    'admin',
    'user',
    'removed'
);


ALTER TYPE public.user_roles OWNER TO postgres;

--
-- Name: add_admin_to_active_groups(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_admin_to_active_groups(uid integer)
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


ALTER PROCEDURE public.add_admin_to_active_groups(uid integer) OWNER TO postgres;

--
-- Name: add_all_features_to_facility(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_all_features_to_facility(group_name character varying, code character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
  DECLARE
    feature_ids int;
  BEGIN
    FOR feature_ids IN SELECT id FROM features
      LOOP
      INSERT INTO features_groups_entities (group_id, entity_id, feature_id) 
      VALUES (
        (SELECT id FROM groups WHERE groups.name=group_name),
        (SELECT id FROM facilities WHERE facilities.jstor_id=code),
        feature_ids
      );
      END LOOP;
  END
$$;


ALTER FUNCTION public.add_all_features_to_facility(group_name character varying, code character varying) OWNER TO postgres;

--
-- Name: add_all_features_to_user(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_all_features_to_user(group_name character varying, email character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
  DECLARE
    feature_ids int;
  BEGIN
    FOR feature_ids IN SELECT id FROM features
      LOOP
      INSERT INTO features_groups_entities (group_id, entity_id, feature_id) 
      VALUES (
        (SELECT id FROM groups WHERE groups.name=group_name),
        (SELECT id FROM users WHERE users.jstor_id=email),
        feature_ids
      );
      END LOOP;
  END
$$;


ALTER FUNCTION public.add_all_features_to_user(group_name character varying, email character varying) OWNER TO postgres;

--
-- Name: add_facilities(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_facilities(fac json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    g RECORD;
    e RECORD;
  BEGIN
    INSERT INTO entities (entity_type, name) VALUES ('facilities', fac->>'name') RETURNING id INTO e;
    INSERT INTO facilities (jstor_id, id) VALUES (fac->>'contact', e.id);
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


ALTER PROCEDURE public.add_facilities(fac json) OWNER TO postgres;

--
-- Name: add_facilities(json, boolean); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_facilities(fac json, is_manager boolean)
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
      FOR ufname, ufdetails IN SELECT * FROM json_each(usr->'ungrouped_features') WHERE json_typeof(usr->'ungrouped_features')='object'
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


ALTER PROCEDURE public.add_facilities(fac json, is_manager boolean) OWNER TO postgres;

--
-- Name: add_group_admin(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_group_admin(uid integer, gid integer)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fid INT;
  BEGIN
    INSERT INTO groups_entities (group_id, entity_id, role) VALUES (gid, uid, 'admin');
    FOR fid IN SELECT id FROM features
    LOOP
      INSERT INTO features_groups_entities (group_id, entity_id, feature_id, enabled) 
      VALUES (
        gid,
        uid,
        fid,
        true
      )
      ON CONFLICT
      ON CONSTRAINT features_groups_entities_pkey
      DO UPDATE
      SET enabled=true, updated_at=DEFAULT
      WHERE features_groups_entities.group_id=gid
      AND features_groups_entities.entity_id=uid;
    END LOOP;
END; $$;


ALTER PROCEDURE public.add_group_admin(uid integer, gid integer) OWNER TO postgres;

--
-- Name: add_new_admin(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_new_admin(group_name character varying, admin_name character varying, email character varying) RETURNS void
    LANGUAGE sql
    AS $$
  WITH new_group AS (
    INSERT INTO groups (
      name
    ) VALUES (
      group_name
    ) ON CONFLICT (name) DO UPDATE
      SET name=excluded.name
    RETURNING id
  ),
  new_entity AS (
    INSERT INTO entities (
      entity_type, name
    ) VALUES (
      'users', admin_name
    ) 
    RETURNING id
  ),
  new_user AS (
    INSERT INTO users (
      jstor_id, id
    ) VALUES (
      email,
      (
        SELECT id FROM new_entity
      )
    )
    RETURNING id
  )
  INSERT INTO groups_entities (
    group_id, entity_id, role
  ) VALUES (
    (SELECT id FROM new_group), (SELECT id FROM new_entity), 'admin'
  );
$$;


ALTER FUNCTION public.add_new_admin(group_name character varying, admin_name character varying, email character varying) OWNER TO postgres;

--
-- Name: add_new_facility(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_new_facility(group_name character varying, facility_name character varying, code character varying) RETURNS void
    LANGUAGE sql
    AS $$
  WITH new_group AS (
    INSERT INTO groups (
      name
    ) VALUES (
      group_name
    ) ON CONFLICT (name) DO UPDATE
      SET name=excluded.name
    RETURNING id
  ),
  new_entity AS (
    INSERT INTO entities (
      entity_type, name
    ) VALUES (
      'facilities', facility_name
    ) 
    RETURNING id
  ),
  new_facility AS (
    INSERT INTO facilities (
      jstor_id, id
    ) VALUES (
      code,
      (
        SELECT id FROM new_entity
      )
    )
    RETURNING id
  )
  INSERT INTO groups_entities (
    group_id, entity_id, role
  ) VALUES (
    (SELECT id FROM new_group), (SELECT id FROM new_entity), 'user'
  );
$$;


ALTER FUNCTION public.add_new_facility(group_name character varying, facility_name character varying, code character varying) OWNER TO postgres;

--
-- Name: add_users(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_users(usr json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    g RECORD;
    e RECORD;
  BEGIN
    INSERT INTO entities (entity_type, name) VALUES ('users', usr->>'name') RETURNING id INTO e;
    INSERT INTO users (jstor_id, id) VALUES (usr->>'contact', e.id);
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


ALTER PROCEDURE public.add_users(usr json) OWNER TO postgres;

--
-- Name: add_users(json, boolean); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_users(usr json, is_manager boolean)
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


ALTER PROCEDURE public.add_users(usr json, is_manager boolean) OWNER TO postgres;

--
-- Name: clear_history(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.clear_history(gid integer)
    LANGUAGE plpgsql
    AS $$
  BEGIN
    DELETE FROM status_details WHERE status_details.status_id IN (SELECT statuses.id FROM statuses WHERE statuses.group_id=gid);
    DELETE FROM statuses WHERE statuses.group_id=gid;
END; $$;


ALTER PROCEDURE public.clear_history(gid integer) OWNER TO postgres;

--
-- Name: delete_admin(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_admin(email character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE entity_id=(SELECT id FROM users WHERE users.jstor_id=email);

  DELETE FROM features_groups_entities 
  WHERE entity_id=(SELECT id FROM users WHERE users.jstor_id=email);

  WITH usr AS (
    DELETE FROM users 
    WHERE users.jstor_id=email
    RETURNING id
  )
  DELETE FROM entities WHERE entities.id=(SELECT id FROM usr)
$$;


ALTER FUNCTION public.delete_admin(email character varying) OWNER TO postgres;

--
-- Name: delete_admin(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_admin(group_name character varying, email character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE 
    group_id=(SELECT id FROM groups WHERE groups.name=group_name) 
    AND entity_id=(SELECT id FROM users WHERE users.jstor_id=email);
  DELETE FROM features_groups_entities 
  WHERE entity_id=(SELECT id FROM users WHERE users.jstor_id=email)
  AND group_id=(SELECT id FROM groups WHERE groups.name=group_name);

  WITH usr AS (
    DELETE FROM users 
    WHERE users.jstor_id=email
    RETURNING id
  )
  DELETE FROM entities WHERE entities.id=(SELECT id FROM usr)
$$;


ALTER FUNCTION public.delete_admin(group_name character varying, email character varying) OWNER TO postgres;

--
-- Name: delete_facility(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_facility(code character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code);

  DELETE FROM features_groups_entities 
  WHERE entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code);

  WITH fac AS (
    DELETE FROM facilities 
    WHERE facilities.jstor_id=code
    RETURNING id
  )
  DELETE FROM entities WHERE entities.id=(SELECT id FROM fac)
$$;


ALTER FUNCTION public.delete_facility(code character varying) OWNER TO postgres;

--
-- Name: delete_facility(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_facility(group_name character varying, code character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE 
    group_id=(SELECT id FROM groups WHERE groups.name=group_name) 
    AND entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code);

  DELETE FROM features_groups_entities 
  WHERE entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code)
  AND group_id=(SELECT id FROM groups WHERE groups.name=group_name);
  
  WITH fac AS (
    DELETE FROM facilities 
    WHERE facilities.jstor_id=code
    RETURNING id
  )
  DELETE FROM entities WHERE entities.id=(SELECT id FROM fac)
$$;


ALTER FUNCTION public.delete_facility(group_name character varying, code character varying) OWNER TO postgres;

--
-- Name: delete_group(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.delete_group(gid integer)
    LANGUAGE plpgsql
    AS $$
  BEGIN
    UPDATE groups_entities SET role='removed', updated_at=NOW() WHERE group_id=gid;
    UPDATE features_groups_entities SET enabled=false, updated_at=NOW() WHERE group_id=gid;
    UPDATE groups SET is_active=false, updated_at=NOW() WHERE id=gid;
END; $$;


ALTER PROCEDURE public.delete_group(gid integer) OWNER TO postgres;

--
-- Name: delete_subdomain(integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.delete_subdomain(sub_id integer)
    LANGUAGE plpgsql
    AS $$
  BEGIN
    DELETE FROM subdomains_facilities WHERE subdomain=(SELECT subdomain FROM subdomains WHERE id=sub_id);
    UPDATE subdomains SET is_active=false, updated_at=NOW() WHERE id=sub_id;
END; $$;


ALTER PROCEDURE public.delete_subdomain(sub_id integer) OWNER TO postgres;

--
-- Name: edit_admin_with_features(json); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.edit_admin_with_features(usr json) RETURNS void
    LANGUAGE plpgsql
    AS $$
  BEGIN
    RAISE NOTICE 'Value: %', usr->'email';
    -- INSERT INTO entities (entity_type, name) VALUES ('users', usr->'name') RETURNING id INTO e;
    -- INSERT INTO users (jstor_id, id) VALUES (usr->'email', e.id);
    
    -- FOR g IN (SELECT * FROM json_to_recordset(usr->'groups') AS grp(id INT, features JSON))
    -- LOOP
    --   INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, e.id, 'admin');
    --   FOR fname, fenabled IN SELECT * FROM json_each(g.features)
    --   LOOP
    --     SELECT id INTO fid FROM features WHERE name=fname;
    --     RAISE NOTICE 'Value: %', fid;
    --     INSERT INTO features_groups_entities(group_id, entity_id, feature_id, enabled) VALUES (g.id, e.id, fid, fenabled);
    --     return next;
    --   END LOOP;
    --   return next;
    -- END LOOP;
  END;
$$;


ALTER FUNCTION public.edit_admin_with_features(usr json) OWNER TO postgres;

--
-- Name: edit_facilities(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_facilities(fac json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    g RECORD;
    facility_id INT;
    sitename VARCHAR;
    facility_name VARCHAR;
    c INT;
    n INT;
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    r RECORD;
  BEGIN
    facility_id:=(fac->>'id')::INT;
    sitename:=fac->>'contact';
    facility_name:=fac->>'name';
    IF facility_id=0 THEN
      SELECT id INTO facility_id FROM facilities WHERE jstor_id=sitename;
    END IF;
    SELECT * INTO r FROM facilities WHERE id = facility_id;
    IF r.jstor_id!=sitename THEN
      UPDATE facilities SET jstor_id=sitename, updated_at=DEFAULT WHERE id = facility_id;
    END IF;
    SELECT * INTO r FROM entities WHERE id = facility_id;
    IF r.name!=facility_name THEN
      UPDATE entities SET name=facility_name, updated_at=DEFAULT WHERE id = facility_id;
    END IF;


    FOR g IN (SELECT * FROM json_to_recordset(fac->'groups') AS grp(id INT, features JSON))
    LOOP
      SELECT COUNT(id) INTO c FROM groups_entities WHERE group_id=g.id AND entity_id=facility_id;
      SELECT COUNT(id) INTO n FROM groups_entities WHERE group_id=g.id AND entity_id=facility_id AND role='user';
      IF c = 0 AND n = 0 THEN
        INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, facility_id, 'user');
      ELSIF n = 0 THEN
        UPDATE groups_entities SET role='user', updated_at=DEFAULT WHERE group_id=g.id AND entity_id=facility_id;
      END IF;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        SELECT COUNT(feature_id) INTO c FROM features_groups_entities WHERE group_id=g.id AND entity_id=facility_id AND feature_id=fid;
        IF c = 0 THEN
          INSERT INTO features_groups_entities(group_id, entity_id, feature_id, enabled) VALUES (g.id, facility_id, fid, fenabled);
        ELSE 
          UPDATE features_groups_entities
          SET enabled = fenabled, updated_at=DEFAULT 
          WHERE group_id=g.id AND entity_id=facility_id AND feature_id=fid;
        END IF;
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.edit_facilities(fac json) OWNER TO postgres;

--
-- Name: edit_facilities(json, boolean); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_facilities(fac json, is_manager boolean)
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
      FOR ufname, ufdetails IN SELECT * FROM json_each(usr->'ungrouped_features') WHERE json_typeof(usr->'ungrouped_features')='object'
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


ALTER PROCEDURE public.edit_facilities(fac json, is_manager boolean) OWNER TO postgres;

--
-- Name: edit_user_groups(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_user_groups(usr json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    g RECORD;
    user_id INT;
    c INT;
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;

  BEGIN
    user_id:=(usr->>'id')::INT;

    FOR g IN (SELECT * FROM groups_entities WHERE groups_entities.entity_id=user_id)
    LOOP
      UPDATE features_groups_entities SET enabled=false WHERE features_groups_entities.entity_id=g.entity_id AND features_groups_entities.group_id=g.group_id;
    END LOOP;

    FOR g IN (SELECT * FROM json_to_recordset(usr->'groups') AS grp(id INT, features JSON))
    LOOP
      SELECT COUNT(id) INTO c FROM groups_entities WHERE group_id=g.id AND entity_id=user_id;
      RAISE NOTICE 'Count 1: %', c;
      IF c = 0 THEN
        INSERT INTO groups_entities(group_id, entity_id, role) VALUES (g.id, user_id, 'admin');
      END IF;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        SELECT COUNT(feature_id) INTO c FROM features_groups_entities WHERE group_id=g.id AND entity_id=user_id AND feature_id=fid;
        RAISE NOTICE 'Count 2: %', c;

        IF c = 0 THEN
          INSERT INTO features_groups_entities(group_id, entity_id, feature_id, enabled) VALUES (g.id, e.id, fid, fenabled);
        ELSE 
          UPDATE features_groups_entities
          SET enabled = fenabled, updated_at=DEFAULT 
          WHERE group_id=g.id AND entity_id=user_id AND feature_id=fid;
        END IF;
      END LOOP;
    END LOOP;
  END; $$;


ALTER PROCEDURE public.edit_user_groups(usr json) OWNER TO postgres;

--
-- Name: edit_user_identifiers(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_user_identifiers(usr json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    user_id INT;
    email VARCHAR;
    user_name VARCHAR;
    r RECORD;
  BEGIN
    user_id:=(usr->>'id')::INT;
    email:=usr->>'email';
    user_name:=usr->>'name';
    SELECT * INTO r FROM users WHERE id = user_id;
    IF r.jstor_id!=email THEN
      UPDATE users SET jstor_id=email, updated_at=DEFAULT WHERE id = user_id;
    END IF;
    SELECT * INTO r FROM entities WHERE id = user_id;
    IF r.name!=user_name THEN
      UPDATE entities SET name=user_name, updated_at=DEFAULT WHERE id = user_id;
    END IF;
  END; $$;


ALTER PROCEDURE public.edit_user_identifiers(usr json) OWNER TO postgres;

--
-- Name: edit_users(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_users(usr json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    g RECORD;
    user_id INT;
    email VARCHAR;
    user_name VARCHAR;
    c INT;
    n INT;
    fname VARCHAR;
    fenabled BOOLEAN;
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


ALTER PROCEDURE public.edit_users(usr json) OWNER TO postgres;

--
-- Name: edit_users(json, boolean); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.edit_users(usr json, is_manager boolean)
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
        fenabled:=(ufdetails->>'enabled'); 
        INSERT INTO ungrouped_features_entities (entity_id, feature_id, enabled) 
        VALUES (user_id, (SELECT id FROM ungrouped_features WHERE name=ufname), fenabled)
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


ALTER PROCEDURE public.edit_users(usr json, is_manager boolean) OWNER TO postgres;

--
-- Name: feature_mods(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.feature_mods() RETURNS void
    LANGUAGE plpgsql
    AS $$
  DECLARE
    eid int;
    gid int;
    fid int;
  BEGIN
    FOR fid IN SELECT DISTINCT id FROM features
    LOOP
      INSERT INTO features_groups_entities (group_id, entity_id, feature_id, enabled) values (2, 3, fid, true);
    END LOOP;
  END
$$;


ALTER FUNCTION public.feature_mods() OWNER TO postgres;

--
-- Name: fix_feature_sets(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fix_feature_sets() RETURNS void
    LANGUAGE plpgsql
    AS $$
  DECLARE
    eid int;
    gid int;
    fid int;
  BEGIN
    FOR eid IN SELECT DISTINCT entity_id FROM features_groups_entities
    LOOP
      FOR gid IN SELECT group_id from groups_entities WHERE entity_id = eid
      LOOP
        INSERT INTO features_groups_entities (entity_id, group_id, feature_id, enabled)
        VALUES (eid, gid, 133, true);
        -- FOR fid IN SELECT feature_id FROM features_groups_entities WHERE entity_id = eid AND group_id = gid
        -- LOOP
        --   SELECT * FROM features_groups_entities WHERE entity_id = eid AND group_id = gid AND feature_id = fid INTO test;
        --   RAISE NOTICE 'test %', test;
        -- END LOOP;
      END LOOP;
      
    END LOOP;
  END
$$;


ALTER FUNCTION public.fix_feature_sets() OWNER TO postgres;

--
-- Name: get_facilities_ids_and_total(integer[], text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id
      FROM "entities"
      LEFT JOIN facilities ON entities.id=facilities.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=facilities.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE groups.id = ANY(grps)
        AND (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(facilities.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND features_groups_entities.enabled=true
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer) OWNER TO postgres;

--
-- Name: get_facilities_ids_and_total(integer[], text, integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id
      FROM "entities"
      LEFT JOIN facilities ON entities.id=facilities.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=facilities.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(facilities.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND features_groups_entities.enabled=true
        AND 
          CASE 
            WHEN is_manager THEN true
            ELSE groups.id = ANY(grps) 
          END
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean) OWNER TO postgres;

--
-- Name: get_facilities_ids_and_total(integer[], text, integer, integer, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean, include_ungrouped boolean) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id
      FROM "entities"
      LEFT JOIN facilities ON entities.id=facilities.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=facilities.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(facilities.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND features.is_active=true
        AND 
          CASE 
            WHEN is_manager AND include_ungrouped THEN true
            ELSE features_groups_entities.enabled=true
          END
        AND 
          CASE 
            WHEN is_manager AND include_ungrouped THEN true
            ELSE groups.id = ANY(grps) 
          END
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_facilities_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean, include_ungrouped boolean) OWNER TO postgres;

--
-- Name: get_facilities_json(character varying[], character varying[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_json(entity_contact character varying[], entity_role character varying[]) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT row_to_json(u) FROM
        (SELECT
          entities.name,
          entities.id,
          entities.entity_type,
          facilities.jstor_id as contact,

          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  DISTINCT groups.id,
                  groups_entities.role,
                  groups.name,
                  string_to_array(facilities.jstor_id, ',') AS facilities,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                      AND features.is_active=true
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              LEFT JOIN facilities ON entities.id=facilities.id
              WHERE groups_entities.entity_id=entities.id
              AND groups_entities.role = ANY(entity_role::user_roles[])
              AND groups.is_active=true
              AND facilities.jstor_id = ANY(entity_contact)
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN facilities ON entities.id=facilities.id
        WHERE facilities.jstor_id = ANY(entity_contact)
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_facilities_json(entity_contact character varying[], entity_role character varying[]) OWNER TO postgres;

--
-- Name: get_facilities_json_by_id(integer[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_json_by_id(entity_ids integer[]) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT jsonb_agg(row_to_json(u)) FROM
        (SELECT
          entities.name,
          entities.id,
          entities.entity_type,
          facilities.jstor_id as contact,
          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  groups.id,
                  groups_entities.role,
                  groups.name,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              WHERE groups_entities.entity_id=entities.id
              AND entities.id = facilities.id
              AND groups.is_active=true
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN facilities ON entities.id=facilities.id
        LEFT JOIN groups_entities on entities.id=groups_entities.entity_id
        WHERE entities.id = ANY(entity_ids)
        AND groups_entities.role != 'removed'
        ORDER BY entities.name
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_facilities_json_by_id(entity_ids integer[]) OWNER TO postgres;

--
-- Name: get_facilities_json_by_id(integer[], boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facilities_json_by_id(entity_ids integer[], is_manager boolean) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT jsonb_agg(row_to_json(u)) FROM
        (SELECT
          DISTINCT entities.id,
          entities.name,
          entities.entity_type,
          facilities.jstor_id as contact,
          subdomains_facilities.sitecode as primary_sitecode,
          subdomains_facilities.subdomain as subdomain,
          (CASE 
            WHEN is_manager THEN 
            (
                SELECT
                    jsonb_object_agg(ungrouped_features.name, 
                    jsonb_build_object(
                      'enabled', ungrouped_features_entities.enabled,
                      'category', ungrouped_features.category,
                      'display_name', ungrouped_features.display_name,
                      'description', ungrouped_features.description
                    )
                  )
                FROM ungrouped_features_entities
                LEFT JOIN ungrouped_features ON ungrouped_features_entities.feature_id=ungrouped_features.id
                WHERE ungrouped_features_entities.entity_id=entities.id
                AND ungrouped_features.name IS NOT NULL
                AND ungrouped_features_entities.enabled IS NOT NULL
                AND ungrouped_features.is_active=true
            ) 
          END) AS ungrouped_features,


          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  DISTINCT groups.id,
                  groups_entities.role,
                  groups.name,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              WHERE groups_entities.entity_id=entities.id
              AND entities.id = facilities.id
              AND groups.is_active=true
              AND groups_entities.role != 'removed'
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN facilities ON entities.id=facilities.id
        LEFT JOIN groups_entities on entities.id=groups_entities.entity_id
        LEFT JOIN subdomains_facilities on entities.id=subdomains_facilities.facility_id
        WHERE entities.id = ANY(entity_ids)
        AND 
          CASE 
            WHEN is_manager THEN true
            ELSE groups_entities.role != 'removed' 
          END
        ORDER BY entities.name
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_facilities_json_by_id(entity_ids integer[], is_manager boolean) OWNER TO postgres;

--
-- Name: get_facility(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facility(code character varying) RETURNS TABLE(id integer, entity_name character varying, groups text, features text)
    LANGUAGE sql
    AS $$
    SELECT 
      entities.id AS id,
      entities.name AS entity_name, 
      (
        SELECT string_agg(groups.name || ' (' || groups.id || ')' || ': ' || groups_entities.role, ', ' ORDER BY groups.id)
        FROM groups
        LEFT JOIN groups_entities ON groups.id=groups_entities.group_id
        WHERE groups_entities.entity_id=entities.id
      ) AS groups,
      (
        SELECT string_agg(features.name || ' (' || features.id || ')' || ': ' || features_groups_entities.enabled, ', ' ORDER BY features.id)
        FROM features
        LEFT JOIN features_groups_entities ON features.id=features_groups_entities.feature_id
        WHERE features_groups_entities.entity_id=entities.id
      ) AS features
    FROM entities 
    LEFT JOIN facilities ON facilities.id=entities.id 
    LEFT JOIN groups_entities ON groups_entities.entity_id=entities.id
    LEFT JOIN groups ON groups.id=groups_entities.group_id
    LEFT JOIN features_groups_entities ON features_groups_entities.group_id=groups.id AND features_groups_entities.entity_id=entities.id
    LEFT JOIN features ON features.id=features_groups_entities.feature_id
    WHERE LOWER(facilities.jstor_id)=LOWER(code)
    GROUP BY entities.name, entities.id;
$$;


ALTER FUNCTION public.get_facility(code character varying) OWNER TO postgres;

--
-- Name: get_facility_json(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_facility_json(code character varying) RETURNS json
    LANGUAGE sql
    AS $$
    SELECT json_agg(row_to_json(t)) FROM
     (SELECT 
      entities.id AS id,
      entities.name AS entity_name, 
      (
        SELECT json_agg(row_to_json(g)) FROM (
          SELECT DISTINCT groups.name AS group_name, groups.id AS group_id, groups_entities.role
          FROM groups
          LEFT JOIN groups_entities ON groups.id=groups_entities.group_id
          WHERE groups_entities.entity_id=entities.id
          ORDER BY groups.id
        ) AS g
      ) AS groups,
      (
        SELECT json_agg(row_to_json(f)) FROM (
          SELECT DISTINCT features.name, features.id, features_groups_entities.enabled
          FROM features
          LEFT JOIN features_groups_entities ON features.id=features_groups_entities.feature_id
          WHERE features_groups_entities.entity_id=entities.id
          ORDER BY features.id
        ) AS f
      ) AS features
    FROM entities 
    LEFT JOIN facilities ON facilities.id=entities.id 
    LEFT JOIN groups_entities ON groups_entities.entity_id=entities.id
    LEFT JOIN groups ON groups.id=groups_entities.group_id
    LEFT JOIN features_groups_entities ON features_groups_entities.group_id=groups.id AND features_groups_entities.entity_id=entities.id
    LEFT JOIN features ON features.id=features_groups_entities.feature_id
    WHERE LOWER(facilities.jstor_id)=LOWER(code)
    GROUP BY entities.name, entities.id) AS t;
$$;


ALTER FUNCTION public.get_facility_json(code character varying) OWNER TO postgres;

--
-- Name: get_user(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user(email character varying) RETURNS TABLE(id integer, entity_name character varying, groups text, features text)
    LANGUAGE sql
    AS $$
  SELECT 
    entities.id AS id,
    entities.name AS entity_name, 
    (
      SELECT string_agg(groups.name || ' (' || groups.id || ')' || ': ' || groups_entities.role, ', ' ORDER BY groups.id)
      FROM groups
      LEFT JOIN groups_entities ON groups.id=groups_entities.group_id
      WHERE groups_entities.entity_id=entities.id
    ) AS groups,
    (
      SELECT string_agg(features.name || ' (' || features.id || ')' || ': ' || features_groups_entities.enabled, ', ' ORDER BY features.id)
      FROM features
      LEFT JOIN features_groups_entities ON features.id=features_groups_entities.feature_id
      WHERE features_groups_entities.entity_id=entities.id
    ) AS features
  FROM entities 
  LEFT JOIN users ON users.id=entities.id 
  LEFT JOIN groups_entities ON groups_entities.entity_id=entities.id
  LEFT JOIN groups ON groups.id=groups_entities.group_id
  LEFT JOIN features_groups_entities ON features_groups_entities.group_id=groups.id AND features_groups_entities.entity_id=entities.id
  LEFT JOIN features ON features.id=features_groups_entities.feature_id
  WHERE LOWER(users.jstor_id)=LOWER(email)
  GROUP BY entities.name, entities.id;
$$;


ALTER FUNCTION public.get_user(email character varying) OWNER TO postgres;

--
-- Name: get_users_ids_and_total(integer[], text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id, entities.name
      FROM "entities"
      LEFT JOIN users ON entities.id=users.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=users.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE groups.id = ANY(grps)
        AND (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(users.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND features_groups_entities.enabled=true
      ORDER BY entities.name
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer) OWNER TO postgres;

--
-- Name: get_users_ids_and_total(integer[], text, integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id
      FROM "entities"
      LEFT JOIN users ON entities.id=users.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=users.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(users.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND 
          CASE 
            WHEN is_manager THEN true
            ELSE features_groups_entities.enabled=true
          END
        AND 
          CASE 
            WHEN is_manager THEN true
            ELSE groups.id = ANY(grps) 
          END
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean) OWNER TO postgres;

--
-- Name: get_users_ids_and_total(integer[], text, integer, integer, boolean, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean, include_ungrouped boolean) RETURNS TABLE(id integer, total integer)
    LANGUAGE sql
    AS $$
    WITH total_ids AS (
      SELECT DISTINCT entities.id
      FROM "entities"
      LEFT JOIN users ON entities.id=users.id
      LEFT JOIN groups_entities ON groups_entities.entity_id=users.id
      LEFT JOIN groups ON groups_entities.group_id=groups.id
      LEFT JOIN features_groups_entities ON features_groups_entities.entity_id=entities.id 
        AND features_groups_entities.group_id=groups.id 
      LEFT JOIN features ON features.id=features_groups_entities.feature_id
      WHERE (LOWER(entities.name) LIKE '%' || LOWER(query) || '%' OR LOWER(users.jstor_id) LIKE '%' || LOWER(query) || '%')
        AND features.is_active=true
        AND 
          CASE 
            WHEN is_manager AND include_ungrouped THEN true
            ELSE features_groups_entities.enabled=true
          END
        AND 
          CASE 
            WHEN is_manager AND include_ungrouped THEN true
            ELSE groups.id = ANY(grps) 
          END
    )
    SELECT id, CAST(count(*) OVER () AS INT) AS total
    FROM total_ids
    LIMIT l
    OFFSET o;
$$;


ALTER FUNCTION public.get_users_ids_and_total(grps integer[], query text, l integer, o integer, is_manager boolean, include_ungrouped boolean) OWNER TO postgres;

--
-- Name: get_users_json(character varying[], character varying[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_json(entity_contact character varying[], entity_role character varying[]) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT row_to_json(u) FROM
        (SELECT
          entities.name,
          entities.id,
          entities.entity_type,
          users.jstor_id as contact,
          (
              SELECT
                  json_object_agg(ungrouped_features.name, 
                  json_build_object(
                    'enabled', ungrouped_features_entities.enabled,
                    'category', ungrouped_features.category,
                    'display_name', ungrouped_features.display_name,
                    'description', ungrouped_features.description
                  )
                )
              FROM ungrouped_features_entities
              LEFT JOIN ungrouped_features ON ungrouped_features_entities.feature_id=ungrouped_features.id
              WHERE ungrouped_features_entities.entity_id=entities.id
              AND ungrouped_features.name IS NOT NULL
              AND ungrouped_features_entities.enabled IS NOT NULL
              AND ungrouped_features.is_active=true
          ) AS ungrouped_features,
          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  DISTINCT groups.id,
                  groups_entities.role,
                  groups.name,
                  array(
                    SELECT jstor_id FROM facilities WHERE facilities.id IN (
                      SELECT entity_id FROM groups_entities WHERE group_id=groups.id AND role='user'
                    )
                  ) AS facilities,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              LEFT JOIN users ON entities.id=users.id
              LEFT JOIN facilities ON entities.id=facilities.id
              WHERE groups_entities.entity_id=entities.id
              AND groups_entities.role = ANY(entity_role::user_roles[])
              AND groups.is_active=true
              AND users.jstor_id = ANY(entity_contact)
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN users ON entities.id=users.id
        WHERE users.jstor_id = ANY(entity_contact)
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_users_json(entity_contact character varying[], entity_role character varying[]) OWNER TO postgres;

--
-- Name: get_users_json_by_id(integer[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_json_by_id(entity_ids integer[]) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT jsonb_agg(row_to_json(u)) FROM
        (SELECT
          entities.name,
          entities.id,
          entities.entity_type,
          users.jstor_id as contact,
          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  groups.id,
                  groups_entities.role,
                  groups.name,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              WHERE groups_entities.entity_id=entities.id
              AND groups.is_active=true
              AND entities.id = users.id
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN users ON entities.id=users.id
        LEFT JOIN groups_entities on entities.id=groups_entities.entity_id
        WHERE entities.id = ANY(entity_ids)
        AND groups_entities.role != 'removed'
        ORDER BY entities.name
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_users_json_by_id(entity_ids integer[]) OWNER TO postgres;

--
-- Name: get_users_json_by_id(integer[], boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_json_by_id(entity_ids integer[], is_manager boolean) RETURNS json
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN(SELECT jsonb_agg(row_to_json(u)) FROM
        (SELECT
          DISTINCT entities.id,
          entities.name,
          entities.entity_type,
          users.jstor_id as contact,
          (CASE 
            WHEN is_manager THEN 
            (
                SELECT
                    jsonb_object_agg(ungrouped_features.name, 
                    jsonb_build_object(
                      'enabled', ungrouped_features_entities.enabled,
                      'category', ungrouped_features.category,
                      'display_name', ungrouped_features.display_name,
                      'description', ungrouped_features.description
                    )
                  )
                FROM ungrouped_features_entities
                LEFT JOIN ungrouped_features ON ungrouped_features_entities.feature_id=ungrouped_features.id
                WHERE ungrouped_features_entities.entity_id=entities.id
                AND ungrouped_features.name IS NOT NULL
                AND ungrouped_features_entities.enabled IS NOT NULL
                AND ungrouped_features.is_active=true
            ) 
          END) AS ungrouped_features,

          (SELECT jsonb_agg(row_to_json(grps))
          FROM (
              SELECT 
                  DISTINCT groups.id,
                  groups_entities.role,
                  groups.name,
                  (
                      SELECT
                          jsonb_object_agg(features.name, features_groups_entities.enabled)
                      FROM features_groups_entities
                      LEFT JOIN features ON features_groups_entities.feature_id=features.id
                      WHERE features_groups_entities.entity_id=entities.id
                      AND features_groups_entities.group_id=groups.id
                      AND features.name IS NOT NULL
                      AND features_groups_entities.enabled IS NOT NULL
                  ) AS features
              FROM groups_entities
              LEFT JOIN groups ON groups_entities.group_id=groups.id
              LEFT JOIN entities ON groups_entities.entity_id=entities.id
              WHERE groups_entities.entity_id=entities.id
              AND groups.is_active=true
              AND entities.id = users.id
              AND groups_entities.role != 'removed'
              ORDER BY groups.name
          )
          AS grps) AS groups
        FROM entities
        LEFT JOIN users ON entities.id=users.id
        LEFT JOIN groups_entities on entities.id=groups_entities.entity_id
        WHERE entities.id = ANY(entity_ids)
        AND 
          CASE 
            WHEN is_manager THEN true
            ELSE groups_entities.role != 'removed' 
          END
        ORDER BY entities.name
        ) AS u);
      END
  $$;


ALTER FUNCTION public.get_users_json_by_id(entity_ids integer[], is_manager boolean) OWNER TO postgres;

--
-- Name: reactivate_group_admin(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.reactivate_group_admin(uid integer, gid integer)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fid INT;
  BEGIN
    UPDATE groups_entities SET role='admin', updated_at=NOW() WHERE group_id=gid AND entity_id=uid;
    UPDATE features_groups_entities SET enabled=true, updated_at=NOW() WHERE group_id=gid AND entity_id=uid;
END; $$;


ALTER PROCEDURE public.reactivate_group_admin(uid integer, gid integer) OWNER TO postgres;

--
-- Name: remove_admin_from_group(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_admin_from_group(group_name character varying, email character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE 
    group_id=(SELECT id FROM groups WHERE groups.name=group_name) 
    AND entity_id=(SELECT id FROM users WHERE users.jstor_id=email) 
$$;


ALTER FUNCTION public.remove_admin_from_group(group_name character varying, email character varying) OWNER TO postgres;

--
-- Name: remove_facilities(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.remove_facilities(fac json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    fac_id INT;
    g RECORD;
  BEGIN
    fac_id:=(fac->>'id')::INT;
    DELETE FROM subdomains_facilities WHERE subdomains_facilities.facility_id=fac_id;
    FOR g IN (SELECT * FROM json_to_recordset(fac->'groups') AS grp(id INT, features JSON))
    LOOP
      UPDATE groups_entities SET role=NULL, updated_at=DEFAULT WHERE group_id=g.id AND entity_id=fac_id;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        UPDATE features_groups_entities SET enabled=false, updated_at=DEFAULT WHERE group_id=g.id AND entity_id=fac_id AND feature_id=fid;
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.remove_facilities(fac json) OWNER TO postgres;

--
-- Name: remove_facility_from_group(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.remove_facility_from_group(group_name character varying, code character varying) RETURNS void
    LANGUAGE sql
    AS $$
  DELETE FROM groups_entities 
  WHERE 
    group_id=(SELECT id FROM groups WHERE groups.name=group_name) 
    AND entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code) 
$$;


ALTER FUNCTION public.remove_facility_from_group(group_name character varying, code character varying) OWNER TO postgres;

--
-- Name: remove_users(json); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.remove_users(usr json)
    LANGUAGE plpgsql
    AS $$
  DECLARE
    fname VARCHAR;
    fenabled BOOLEAN;
    fid INT;
    g RECORD;
    user_id INT;
  BEGIN
    user_id:=(usr->>'id')::INT;
    FOR g IN (SELECT * FROM json_to_recordset(usr->'groups') AS grp(id INT, features JSON))
    LOOP
      UPDATE groups_entities SET role='removed', updated_at=DEFAULT WHERE group_id=g.id AND entity_id=user_id;
      FOR fname, fenabled IN SELECT * FROM json_each(g.features)
      LOOP
        SELECT id INTO fid FROM features WHERE name=fname;
        UPDATE features_groups_entities SET enabled=false, updated_at=DEFAULT WHERE group_id=g.id AND entity_id=user_id AND feature_id=fid;
      END LOOP;
    END LOOP;
END; $$;


ALTER PROCEDURE public.remove_users(usr json) OWNER TO postgres;

--
-- Name: toggle_feature_for_facility(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.toggle_feature_for_facility(group_name character varying, code character varying, feature_name character varying) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO features_groups_entities (
    group_id,
    entity_id,
    feature_id,
    enabled
  ) VALUES (
    (SELECT id FROM groups WHERE groups.name=group_name),
    (SELECT id FROM facilities WHERE facilities.jstor_id=code),
    (SELECT id FROM features WHERE features.name=feature_name),
    true
  ) ON CONFLICT
  ON CONSTRAINT features_groups_entities_pkey
  DO UPDATE 
  SET enabled= NOT features_groups_entities.enabled, 
  updated_at=DEFAULT 
  WHERE features_groups_entities.group_id=(SELECT id FROM groups WHERE groups.name=group_name)
  AND features_groups_entities.entity_id=(SELECT id FROM facilities WHERE facilities.jstor_id=code)
  AND features_groups_entities.feature_id=(SELECT id FROM features WHERE features.name=feature_name)
$$;


ALTER FUNCTION public.toggle_feature_for_facility(group_name character varying, code character varying, feature_name character varying) OWNER TO postgres;

--
-- Name: toggle_feature_for_user(character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.toggle_feature_for_user(group_name character varying, email character varying, feature_name character varying) RETURNS void
    LANGUAGE sql
    AS $$
  INSERT INTO features_groups_entities (
    group_id,
    entity_id,
    feature_id,
    enabled
  ) VALUES (
    (SELECT id FROM groups WHERE groups.name=group_name),
    (SELECT id FROM users WHERE users.jstor_id=email),
    (SELECT id FROM features WHERE features.name=feature_name),
    true
  ) ON CONFLICT
  ON CONSTRAINT features_groups_entities_pkey
  DO UPDATE 
  SET enabled= NOT features_groups_entities.enabled, 
  updated_at=DEFAULT 
  WHERE features_groups_entities.group_id=(SELECT id FROM groups WHERE groups.name=group_name)
  AND features_groups_entities.entity_id=(SELECT id FROM users WHERE users.jstor_id=email)
  AND features_groups_entities.feature_id=(SELECT id FROM features WHERE features.name=feature_name)
$$;


ALTER FUNCTION public.toggle_feature_for_user(group_name character varying, email character varying, feature_name character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    text text NOT NULL,
    status character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (CURRENT_DATE + '7 days'::interval)
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alerts_id_seq OWNER TO postgres;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.entities (
    id integer NOT NULL,
    entity_type public.entity_types,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.entities OWNER TO postgres;

--
-- Name: entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.entities_id_seq OWNER TO postgres;

--
-- Name: entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.entities_id_seq OWNED BY public.entities.id;


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facilities (
    jstor_id character varying NOT NULL,
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.facilities OWNER TO postgres;

--
-- Name: features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.features (
    id integer NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    display_name character varying NOT NULL,
    category character varying,
    description text,
    is_protected boolean NOT NULL,
    is_admin_only boolean,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.features OWNER TO postgres;

--
-- Name: features_groups_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.features_groups_entities (
    group_id integer NOT NULL,
    entity_id integer NOT NULL,
    feature_id integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.features_groups_entities OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    jstor_id character varying NOT NULL,
    id integer NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: feature_lists_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.feature_lists_view AS
 SELECT entities.name,
        CASE
            WHEN (entities.entity_type = 'users'::public.entity_types) THEN users.jstor_id
            WHEN (entities.entity_type = 'facilities'::public.entity_types) THEN facilities.jstor_id
            ELSE NULL::character varying
        END AS jstor_id,
    groups.name AS group_name,
    ( SELECT string_agg((features_1.name)::text, ', '::text ORDER BY (features_1.name)::text) AS string_agg
           FROM (public.features features_1
             LEFT JOIN public.features_groups_entities features_groups_entities_1 ON ((features_1.id = features_groups_entities_1.feature_id)))
          WHERE ((features_groups_entities_1.enabled = true) AND (features_groups_entities_1.entity_id = entities.id))) AS enabled_features,
    ( SELECT string_agg((features_1.name)::text, ', '::text ORDER BY (features_1.name)::text) AS string_agg
           FROM (public.features features_1
             LEFT JOIN public.features_groups_entities features_groups_entities_1 ON ((features_1.id = features_groups_entities_1.feature_id)))
          WHERE ((features_groups_entities_1.enabled = false) AND (features_groups_entities_1.entity_id = entities.id))) AS disabled_features
   FROM (((((public.features
     LEFT JOIN public.features_groups_entities ON ((features_groups_entities.feature_id = features.id)))
     LEFT JOIN public.entities ON ((entities.id = features_groups_entities.entity_id)))
     LEFT JOIN public.facilities ON ((facilities.id = entities.id)))
     LEFT JOIN public.users ON ((users.id = entities.id)))
     LEFT JOIN public.groups ON ((features_groups_entities.group_id = groups.id)))
  GROUP BY entities.name, entities.id, entities.entity_type, users.jstor_id, facilities.jstor_id, groups.name
  ORDER BY entities.name;


ALTER TABLE public.feature_lists_view OWNER TO postgres;

--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.features_id_seq OWNER TO postgres;

--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: fid; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fid (
    id integer
);


ALTER TABLE public.fid OWNER TO postgres;

--
-- Name: groups_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups_entities (
    id integer NOT NULL,
    group_id integer,
    entity_id integer,
    role public.user_roles,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.groups_entities OWNER TO postgres;

--
-- Name: group_members_jstor_id_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.group_members_jstor_id_view AS
 SELECT grps.name AS group_name,
    ( SELECT string_agg(DISTINCT (users.jstor_id)::text, ', '::text ORDER BY (users.jstor_id)::text) AS string_agg
           FROM ((public.groups
             LEFT JOIN public.groups_entities groups_entities_1 ON ((groups.id = groups_entities_1.group_id)))
             LEFT JOIN public.users ON ((users.id = groups_entities_1.entity_id)))
          WHERE ((groups_entities_1.role = 'admin'::public.user_roles) AND (grps.id = groups.id))) AS admins,
    ( SELECT string_agg(DISTINCT (facilities.jstor_id)::text, ', '::text ORDER BY (facilities.jstor_id)::text) AS string_agg
           FROM ((public.groups
             LEFT JOIN public.groups_entities groups_entities_1 ON ((groups.id = groups_entities_1.group_id)))
             LEFT JOIN public.facilities ON ((facilities.id = groups_entities_1.entity_id)))
          WHERE ((groups_entities_1.role = 'user'::public.user_roles) AND (grps.id = groups.id))) AS users
   FROM ((public.groups grps
     LEFT JOIN public.groups_entities ON ((grps.id = groups_entities.group_id)))
     LEFT JOIN public.entities ON ((entities.id = groups_entities.entity_id)))
  GROUP BY grps.name, grps.id
  ORDER BY grps.name;


ALTER TABLE public.group_members_jstor_id_view OWNER TO postgres;

--
-- Name: group_members_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.group_members_view AS
 SELECT grps.name AS group_name,
    ( SELECT string_agg(DISTINCT (entities_1.name)::text, ', '::text ORDER BY (entities_1.name)::text) AS string_agg
           FROM ((public.groups
             LEFT JOIN public.groups_entities groups_entities_1 ON ((groups.id = groups_entities_1.group_id)))
             LEFT JOIN public.entities entities_1 ON ((entities_1.id = groups_entities_1.entity_id)))
          WHERE ((groups_entities_1.role = 'admin'::public.user_roles) AND (grps.id = groups.id))) AS admins,
    ( SELECT string_agg(DISTINCT (entities_1.name)::text, ', '::text ORDER BY (entities_1.name)::text) AS string_agg
           FROM ((public.groups
             LEFT JOIN public.groups_entities groups_entities_1 ON ((groups.id = groups_entities_1.group_id)))
             LEFT JOIN public.entities entities_1 ON ((entities_1.id = groups_entities_1.entity_id)))
          WHERE ((groups_entities_1.role = 'user'::public.user_roles) AND (grps.id = groups.id))) AS users
   FROM ((public.groups grps
     LEFT JOIN public.groups_entities ON ((grps.id = groups_entities.group_id)))
     LEFT JOIN public.entities ON ((entities.id = groups_entities.entity_id)))
  GROUP BY grps.name, grps.id
  ORDER BY grps.name;


ALTER TABLE public.group_members_view OWNER TO postgres;

--
-- Name: groups_entitites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_entitites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_entitites_id_seq OWNER TO postgres;

--
-- Name: groups_entitites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_entitites_id_seq OWNED BY public.groups_entities.id;


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.groups_id_seq OWNER TO postgres;

--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: ip_bypass; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ip_bypass (
    id integer NOT NULL,
    facility_id integer,
    ip character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ip_bypass OWNER TO postgres;

--
-- Name: ip_bypass_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ip_bypass_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ip_bypass_id_seq OWNER TO postgres;

--
-- Name: ip_bypass_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ip_bypass_id_seq OWNED BY public.ip_bypass.id;


--
-- Name: status_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.status_details (
    id integer NOT NULL,
    status_id integer,
    type character varying,
    detail text
);


ALTER TABLE public.status_details OWNER TO postgres;

--
-- Name: status_details_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.status_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.status_details_id_seq OWNER TO postgres;

--
-- Name: status_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.status_details_id_seq OWNED BY public.status_details.id;


--
-- Name: statuses; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.statuses OWNER TO postgres;

--
-- Name: statuses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.statuses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.statuses_id_seq OWNER TO postgres;

--
-- Name: statuses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.statuses_id_seq OWNED BY public.statuses.id;


--
-- Name: subdomains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subdomains (
    id integer NOT NULL,
    subdomain character varying NOT NULL,
    entity_type public.entity_types,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subdomains OWNER TO postgres;

--
-- Name: subdomains_facilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subdomains_facilities (
    subdomain character varying NOT NULL,
    sitecode character varying NOT NULL,
    facility_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subdomains_facilities OWNER TO postgres;

--
-- Name: subdomains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subdomains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.subdomains_id_seq OWNER TO postgres;

--
-- Name: subdomains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subdomains_id_seq OWNED BY public.subdomains.id;


--
-- Name: tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens (
    id integer NOT NULL,
    token character varying NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tokens OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tokens_id_seq OWNER TO postgres;

--
-- Name: tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_id_seq OWNED BY public.tokens.id;


--
-- Name: ungrouped_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ungrouped_features (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    category character varying NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.ungrouped_features OWNER TO postgres;

--
-- Name: ungrouped_features_entities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ungrouped_features_entities (
    id integer NOT NULL,
    feature_id integer NOT NULL,
    entity_id integer NOT NULL,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ungrouped_features_entities OWNER TO postgres;

--
-- Name: ungrouped_features_entities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ungrouped_features_entities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ungrouped_features_entities_id_seq OWNER TO postgres;

--
-- Name: ungrouped_features_entities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ungrouped_features_entities_id_seq OWNED BY public.ungrouped_features_entities.id;


--
-- Name: ungrouped_features_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ungrouped_features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ungrouped_features_id_seq OWNER TO postgres;

--
-- Name: ungrouped_features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ungrouped_features_id_seq OWNED BY public.ungrouped_features.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities ALTER COLUMN id SET DEFAULT nextval('public.entities_id_seq'::regclass);


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: groups_entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_entities ALTER COLUMN id SET DEFAULT nextval('public.groups_entitites_id_seq'::regclass);


--
-- Name: ip_bypass id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_bypass ALTER COLUMN id SET DEFAULT nextval('public.ip_bypass_id_seq'::regclass);


--
-- Name: status_details id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_details ALTER COLUMN id SET DEFAULT nextval('public.status_details_id_seq'::regclass);


--
-- Name: statuses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statuses ALTER COLUMN id SET DEFAULT nextval('public.statuses_id_seq'::regclass);


--
-- Name: subdomains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains ALTER COLUMN id SET DEFAULT nextval('public.subdomains_id_seq'::regclass);


--
-- Name: tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens ALTER COLUMN id SET DEFAULT nextval('public.tokens_id_seq'::regclass);


--
-- Name: ungrouped_features id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features ALTER COLUMN id SET DEFAULT nextval('public.ungrouped_features_id_seq'::regclass);


--
-- Name: ungrouped_features_entities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features_entities ALTER COLUMN id SET DEFAULT nextval('public.ungrouped_features_entities_id_seq'::regclass);


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, text, status, created_at, expires_at) FROM stdin;
34	This is a demo alert!	success	2023-08-29 18:01:44.741382	2023-09-05 00:00:00
\.


--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.entities (id, entity_type, name, created_at, updated_at) FROM stdin;
5	users	Stacy Burnett	2022-04-25 14:09:02.783737	2022-04-25 14:09:02.783737
6	users	Alex Humphreys	2022-04-25 14:10:53.41838	2022-04-25 14:10:53.41838
7	users	Jessica Pokharel	2022-04-25 14:10:53.425042	2022-04-25 14:10:53.425042
8	users	Laura Brown	2022-04-25 14:10:53.430786	2022-04-25 14:10:53.430786
9	users	Ron Snyder	2022-04-25 14:10:53.437015	2022-04-25 14:10:53.437015
10	users	Laura Hillegas	2022-04-25 14:10:53.443158	2022-04-25 14:10:53.443158
11	users	Julia Ha	2022-04-25 14:10:53.44899	2022-04-25 14:10:53.44899
12	users	Jessica Pokharel	2022-04-25 14:11:19.015077	2022-04-25 14:11:19.015077
34	users	Cameron Heard	2022-06-06 19:43:11.689586	2022-06-06 19:43:11.689586
35	users	Benjamin Jones	2022-06-22 13:34:07.943829	2022-06-22 13:34:07.943829
36	facilities	Wisconsin Test Facility	2022-06-22 13:36:39.477726	2022-06-22 13:36:39.477726
37	users	Andromeda Yelton	2022-06-29 20:43:36.716764	2022-06-29 20:43:36.716764
67	facilities	Colorado Test Facility	2022-07-21 19:01:13.762575	2022-07-21 19:01:13.762575
69	users	James Like	2022-07-22 19:05:14.152305	2022-07-22 19:05:14.152305
70	users	Darryl Dryer	2022-07-22 19:06:02.061841	2022-07-22 19:06:02.061841
71	users	Leigh Burrows	2022-07-22 20:56:36.446228	2022-07-22 20:56:36.446228
305	facilities	ITHAKA Test Facility	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
4	facilities	ITHAKA Facility	2022-04-12 19:54:37.447322	2022-04-12 19:54:37.447322
3	users	Ryan McCarthy	2022-04-10 20:40:05.904512	2024-06-03 19:29:32.75822
210	facilities	Ilium Facility	2023-04-11 23:22:38.838104	2023-04-12 00:09:58.54775
212	facilities	Test Facility	2023-05-17 15:05:29.076563	2023-05-17 15:05:29.076563
133	users	Ryan McCarthy	2023-03-28 19:47:05.2386	2023-06-22 18:20:21.339877
233	facilities	Test Facility 2	2023-06-23 16:24:01.942211	2023-06-23 16:24:01.942211
235	facilities	Test Facility 3	2023-06-23 16:32:28.141818	2023-06-23 16:32:28.141818
236	facilities	Test 7	2023-06-23 16:38:22.888153	2023-06-23 16:38:22.888153
237	facilities	Test Facility 8	2023-06-23 16:52:05.294338	2023-06-23 16:52:05.294338
375	facilities	ITHAKA Test Facility 2	2024-06-07 16:03:44.179632	2024-06-07 16:03:44.179632
238	facilities	ILIUM Test Facility	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
\.


--
-- Data for Name: facilities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facilities (jstor_id, id, updated_at) FROM stdin;
wisconsin.gov	36	2023-03-31 01:39:28.537106
state.co.us	67	2023-03-31 01:39:28.537106
test.com	212	2023-05-17 15:05:29.076563
test.gov	233	2023-06-23 16:24:01.942211
test3@test.com	235	2023-06-23 16:32:28.141818
Test7@test.com	236	2023-06-23 16:38:22.888153
test8.com	237	2023-06-23 16:52:05.294338
ilium.gov	238	2023-06-27 15:25:17.397674
test-ilium.org	210	2023-04-11 23:22:38.838104
ithaka.edu	305	2024-03-25 18:39:31.668595
test-jstor.org	375	2024-06-07 16:03:44.179632
jstor.org	4	2025-01-06 21:46:57.070044
\.


--
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.features (id, name, created_at, updated_at, display_name, category, description, is_protected, is_admin_only, is_active) FROM stdin;
35	view_snippet	2022-12-01 16:34:50.648265	2022-12-01 16:34:50.648265	View Snippet	Search Results	Allows the user to see snippets of the text that include the search term	f	f	t
70	remove_users	2023-03-28 19:49:48.632038	2023-03-28 19:49:48.632038	Remove Users	User Management	Allows the user to remove other users	f	t	t
67	get_users	2023-03-28 19:49:48.611425	2023-03-28 19:49:48.611425	Get Users	User Management	Allows the user to view a list of users in the group, including name, email, and privileges	f	t	t
34	view_abstract	2022-12-01 16:34:45.293998	2022-12-01 16:34:45.293998	View Abstract	Search Results	Allows the user to see an abstract if one is provided	f	f	t
36	view_book_description	2022-12-01 16:34:59.184784	2022-12-01 16:34:59.184784	View Book Description	Search Results	Allows the user to see a description of the book the chapter comes from if one is provided	f	f	t
41	print_pdf	2022-12-09 18:04:18.616854	2022-12-09 18:04:18.616854	Print PDFs	Search Results	Allows the user to print a copy of the PDF	f	f	t
40	download_pdf	2022-12-09 18:04:18.616854	2022-12-09 18:04:18.616854	Download PDFs	Search Results	Allows the user to download a copy of the PDF	f	f	t
106	use_protected_features	2023-04-10 14:19:09.547672	2023-04-10 14:19:09.547672	Use Protected Features	ITHAKA Administration	Allows the user to view, add, or remove features that are hidden for most users	t	t	t
101	manage_facilities	2023-04-10 14:12:38.73055	2023-04-10 14:12:38.73055	Manage Facilities	ITHAKA Administration	Allows the user to add, edit, or remove facilities from groups	t	t	t
71	is_hidden_user	2023-03-28 20:24:11.930465	2023-03-28 20:24:11.930465	Hidden User	ITHAKA Administration	Hides the user from view for anyone without the View Hidden Users feature	t	t	t
73	approve_requests	2023-03-28 23:00:23.790506	2023-03-28 23:00:23.790506	Approve Requests	Media Review	Allows the user to approve requests for media access	f	t	t
74	deny_requests	2023-03-28 23:00:23.797628	2023-03-28 23:00:23.797628	Deny Requests	Media Review	Allows the user to deny requests for media access	f	t	t
72	view_hidden_users	2023-03-28 20:24:36.932544	2023-03-28 20:24:36.932544	View Hidden Users	ITHAKA Administration	Allows the user to view hidden users	t	t	t
133	view_pdf	2023-08-28 14:16:30.909754	2023-08-28 14:16:30.909754	View PDF	Search Results	Allows the user to view approved PDFs. This feature does not allow the user to view unapproved PDFs.	f	f	t
166	view_document	2023-11-02 00:06:36.251581	2023-11-02 00:06:36.251581	View Document	Search Results	Allows the user to view the page images for a approved documents. This features does not allow the user to view unapproved documents.	f	f	t
75	bulk_approve	2023-03-28 23:00:23.804051	2023-03-28 23:00:23.804051	Bulk Approve	Media Review	Allows the user to approve entire disciplines or journals	f	t	t
76	undo_bulk_approve	2023-03-28 23:00:24.837661	2023-03-28 23:00:24.837661	Undo Bulk Approve	Media Review	Allows the user to undo an existing bulk approval	f	t	t
68	add_or_edit_users	2023-03-28 19:49:48.619462	2024-06-13 21:29:06.850273	Add or Edit Users	User Management	Allows the user to add or edit other users	f	t	t
232	submit_requests	2025-01-06 21:46:38.939642	2025-01-06 21:46:38.939642	Submit Requests	Search Results	Allows a user to submit a request for access to material on JSTOR	f	f	t
100	get_facilities	2023-04-10 14:12:38.716502	2023-04-10 14:12:38.716502	Get Facilities	Facilities Management	Allows the user to view a list of facilities where students can access JSTOR	f	t	t
199	test_feature_1	2024-06-13 16:03:26.52365	2025-01-06 21:47:36.638202	Test Feature 1	Testing	This is a test feature.	f	f	f
102	edit_facilities	2023-04-10 14:12:38.744207	2023-04-10 14:12:38.744207	Edit Facilities	Facilities Management	Allows the user to edit the features that are enabled at facilities	f	t	t
200	test_feature_2	2024-06-13 21:45:03.03296	2025-01-06 21:47:42.169905	Test Feature 2	Testing	This is a test feature.	f	f	f
201	test_feature_3	2024-06-13 21:47:03.550218	2025-01-06 21:47:46.657462	Test Feature 3	Testing	This is a test feature.	f	t	f
\.


--
-- Data for Name: features_groups_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.features_groups_entities (group_id, entity_id, feature_id, enabled, created_at, updated_at) FROM stdin;
195	12	35	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
1	375	68	f	2024-06-07 16:03:44.179632	2024-06-13 20:40:02.986073
1	375	72	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	12	69	t	2023-04-06 18:52:09.284155	2023-04-06 21:08:30.45556
1	375	133	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	73	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	75	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	74	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	40	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	35	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	12	68	f	2023-04-06 18:52:09.284155	2024-06-13 20:40:02.986073
2	11	68	f	2023-04-06 18:54:24.122316	2024-06-13 20:40:02.986073
2	8	68	f	2023-04-06 18:53:24.509148	2024-06-13 20:40:02.986073
1	8	68	f	2023-04-06 18:53:24.509148	2024-06-13 20:40:02.986073
1	9	68	f	2023-04-06 18:53:47.877498	2024-06-13 20:40:02.986073
1	375	100	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	67	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
2	3	201	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:46.655416
1	375	71	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	3	201	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:46.655416
1	375	101	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	41	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	375	70	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
195	3	201	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:46.655416
1	12	67	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	375	76	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	12	41	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	40	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	4	41	t	2022-12-09 18:05:34.188612	2025-01-07 17:52:19.372122
1	4	70	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	375	106	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	12	101	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
1	12	71	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	73	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	4	232	f	2025-01-06 21:46:57.070044	2025-01-07 17:52:19.372122
1	4	76	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	106	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	3	69	t	2023-03-28 20:25:27.229591	2023-04-10 22:41:15.292259
1	4	34	t	2022-12-02 21:25:41.179515	2025-01-07 17:52:19.372122
1	12	74	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	72	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	75	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	100	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
1	375	34	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	8	69	t	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
1	12	102	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
2	5	34	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	36	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	11	73	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	40	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	102	t	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
1	11	100	t	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
1	375	36	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
2	8	73	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	75	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	74	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	40	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	69	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	67	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
1	375	166	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
1	11	67	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	71	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	4	36	t	2022-12-02 21:26:29.70826	2025-01-07 17:52:19.372122
1	4	40	t	2022-12-09 18:05:34.188612	2025-01-07 17:52:19.372122
1	4	71	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	101	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
2	3	199	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:36.637141
1	3	199	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:36.637141
195	3	199	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:36.637141
1	11	101	t	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
1	11	41	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	3	200	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:42.168881
1	3	200	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:42.168881
195	3	200	f	2024-09-24 12:57:07.824769	2025-01-06 21:47:42.168881
2	5	72	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	8	71	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
1	11	70	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	76	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	8	73	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
2	8	41	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	70	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	76	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	34	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	36	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	72	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
2	8	35	f	2023-04-06 18:53:24.509148	2023-04-06 18:55:27.534492
1	8	75	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	74	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	40	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	67	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	71	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	41	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	70	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	76	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	34	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	36	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	72	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	8	35	f	2023-04-06 18:53:24.509148	2024-04-30 20:47:16.441868
1	11	106	t	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
1	11	34	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	36	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	72	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	5	35	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
1	5	73	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	75	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
2	238	40	t	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
2	238	41	t	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
2	238	34	t	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
2	238	36	t	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
2	238	35	t	2023-06-27 15:25:17.397674	2024-06-11 22:41:36.531361
1	210	232	t	2025-01-06 21:47:07.36144	2025-01-06 21:47:07.36144
2	12	69	t	2023-04-06 18:52:09.284155	2023-04-06 21:08:30.45556
1	375	102	f	2024-06-07 16:03:44.179632	2024-06-07 16:07:24.175936
195	12	70	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
1	236	35	f	2023-06-23 16:38:22.888153	2024-03-25 18:38:48.029326
1	235	35	f	2023-06-23 16:32:28.141818	2024-03-25 18:38:51.321478
2	233	35	f	2023-06-23 19:03:15.639583	2024-03-25 18:38:54.231719
1	4	72	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	35	t	2022-12-02 21:26:25.38449	2025-01-07 17:52:19.372122
195	12	67	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	34	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	36	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	41	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
1	5	68	f	2023-04-04 15:34:26.828188	2024-06-13 20:40:02.986073
195	12	68	f	2024-06-04 18:12:42.838897	2024-06-13 20:40:02.986073
1	37	68	f	2023-04-06 18:54:49.477196	2024-06-13 20:40:02.986073
2	37	68	f	2023-04-06 18:54:49.477196	2024-06-13 20:40:02.986073
1	11	68	f	2023-04-06 18:54:24.122316	2024-06-13 20:40:02.986073
1	133	68	f	2023-06-08 20:58:06.926997	2024-06-13 20:40:02.986073
2	3	34	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	11	67	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	3	74	t	2023-03-28 23:02:54.216965	2024-09-24 13:20:52.47348
1	3	40	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
1	3	102	t	2023-04-10 14:20:51.674303	2024-09-24 13:20:52.47348
2	11	71	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	3	100	t	2023-04-10 14:20:51.660035	2024-09-24 13:20:52.47348
1	3	67	t	2023-03-28 20:25:27.191633	2024-09-24 13:20:52.47348
1	3	71	t	2023-03-28 20:25:27.255713	2024-09-24 13:20:52.47348
1	37	73	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	12	70	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	34	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	3	101	t	2023-04-10 14:20:51.667134	2024-09-24 13:20:52.47348
1	3	70	t	2023-03-28 20:25:27.240062	2024-09-24 13:20:52.47348
1	12	36	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
195	3	75	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
1	11	69	t	2023-04-06 18:54:24.122316	2023-04-06 18:54:24.122316
1	37	75	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	74	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	40	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	67	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	41	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
195	3	102	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	100	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
2	11	69	t	2023-04-06 18:54:24.122316	2023-04-06 18:54:24.122316
1	5	74	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	37	70	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	76	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	5	40	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	37	69	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
1	37	71	f	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
1	37	72	f	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	73	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	75	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	74	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	40	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	69	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	67	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	71	f	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	41	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	70	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	76	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	34	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	36	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	72	f	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
2	37	35	t	2023-04-06 18:54:49.477196	2023-04-06 18:54:49.477196
1	12	106	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
1	12	76	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	37	34	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
2	11	101	f	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
2	11	41	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	70	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	76	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	106	f	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
1	37	36	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	37	35	t	2023-04-06 18:54:49.477196	2024-04-30 21:14:38.439234
1	133	73	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	75	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	74	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	40	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	102	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	100	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	67	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	71	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	9	73	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	75	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	74	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	40	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	69	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	67	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	71	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	41	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	70	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	76	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	34	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	36	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	72	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
1	9	35	t	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	73	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	75	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	74	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	40	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	69	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	67	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	71	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	41	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	70	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	76	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	34	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	36	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	72	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
2	9	35	f	2023-04-06 18:53:47.877498	2023-04-06 18:55:34.620063
195	3	76	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
1	5	69	t	2023-04-04 15:34:26.828188	2023-04-06 18:55:48.649459
2	9	68	f	2023-04-06 18:53:47.877498	2024-06-13 20:40:02.986073
2	5	68	f	2023-04-06 16:19:23.870617	2024-06-13 20:40:02.986073
1	6	68	f	2023-04-06 18:52:46.999216	2024-06-13 20:40:02.986073
2	6	68	f	2023-04-06 18:52:46.999216	2024-06-13 20:40:02.986073
2	5	69	f	2023-04-06 16:19:23.870617	2023-04-06 18:55:48.649459
2	5	73	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	75	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	74	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	40	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	67	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	71	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	41	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
2	5	70	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
195	12	40	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	106	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	101	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	71	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	73	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	74	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	72	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	133	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	166	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	75	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	76	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	100	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
195	12	102	f	2024-06-04 18:12:42.838897	2024-06-06 17:37:32.993865
2	5	76	f	2023-04-06 16:19:23.870617	2024-06-03 23:48:48.979652
1	5	67	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	71	f	2023-03-28 21:58:26.855978	2024-06-03 23:48:48.979652
1	5	41	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	70	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	76	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	34	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	6	73	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	75	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	74	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	40	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	69	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	67	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	71	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	41	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	70	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	76	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	34	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	36	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	72	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	6	35	t	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	73	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	75	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	5	36	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
1	5	72	f	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
2	11	75	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	74	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	40	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	102	f	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
2	11	100	f	2023-05-01 17:16:25.525374	2024-06-03 22:46:23.851994
2	6	74	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	40	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	69	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	67	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	71	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	41	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	70	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	76	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	34	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	36	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	72	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
2	6	35	f	2023-04-06 18:52:46.999216	2023-04-06 19:14:40.299894
1	212	71	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	101	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	41	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	210	68	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	73	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	75	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	5	35	t	2023-04-04 15:34:26.828188	2024-06-03 23:48:48.979652
2	12	68	f	2023-04-06 18:52:09.284155	2024-06-13 20:40:02.986073
1	212	68	f	2023-05-17 15:05:29.076563	2024-06-13 20:40:02.986073
1	305	68	f	2024-03-25 18:39:31.668595	2024-06-13 20:40:02.986073
1	212	70	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	76	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	106	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
2	3	69	t	2023-03-28 20:25:27.318127	2023-04-10 22:41:15.292259
2	12	73	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	75	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	12	35	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	212	73	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	75	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	74	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	40	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	102	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	100	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	67	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	34	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	36	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	72	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
1	212	35	f	2023-05-17 15:05:29.076563	2024-03-25 18:38:57.903524
2	238	67	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
1	133	101	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	41	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	70	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	76	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	106	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	34	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	36	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	11	34	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	36	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	72	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	11	35	f	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	238	71	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	101	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	70	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	76	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	106	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	72	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
1	305	35	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	70	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	67	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	34	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	36	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	41	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	40	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	106	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	101	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	71	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	73	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	74	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	72	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	133	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	166	t	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	75	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	76	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	100	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	305	102	f	2024-03-25 18:39:31.668595	2024-03-25 18:39:31.668595
1	237	36	f	2023-06-23 16:52:05.294338	2024-03-25 18:38:44.266675
1	210	74	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	40	t	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	102	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	100	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	67	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	71	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	101	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	41	t	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	210	68	f	2023-04-11 23:22:38.838104	2024-06-13 20:40:02.986073
1	210	70	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	133	68	f	2023-06-08 20:58:06.926997	2024-06-13 20:40:02.986073
1	210	76	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	12	35	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	210	106	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	210	73	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	75	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	74	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	40	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	102	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	100	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	67	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	71	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
1	210	34	t	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	12	70	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	67	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	34	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	36	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	41	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	40	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	210	101	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	41	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	70	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	76	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	106	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	34	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	210	36	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	12	106	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
2	12	101	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
2	12	71	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	74	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	72	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
1	210	36	t	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	72	f	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
1	210	35	t	2023-04-12 14:39:37.271524	2025-01-06 21:47:07.36144
2	12	76	t	2023-04-06 18:52:09.284155	2024-06-04 18:12:42.838897
2	12	100	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
2	133	73	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	75	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	74	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	40	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	102	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	100	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	67	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	71	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	12	102	t	2023-08-10 17:52:12.190313	2024-06-04 18:12:42.838897
2	3	68	t	2023-03-28 20:25:27.303026	2024-09-24 13:20:52.47348
2	3	73	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	102	t	2023-04-10 14:20:51.703214	2024-09-24 13:20:52.47348
2	3	100	t	2023-04-10 14:20:51.68881	2024-09-24 13:20:52.47348
2	3	67	t	2023-03-28 20:25:27.294863	2024-09-24 13:20:52.47348
2	3	71	t	2023-03-28 20:25:27.335783	2024-09-24 13:20:52.47348
2	3	101	t	2023-04-10 14:20:51.696314	2024-09-24 13:20:52.47348
2	3	41	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	70	t	2023-03-28 20:25:27.328519	2024-09-24 13:20:52.47348
2	3	76	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	106	t	2023-04-10 14:20:51.681119	2024-09-24 13:20:52.47348
2	3	36	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	72	t	2023-03-28 20:25:29.084986	2024-09-24 13:20:52.47348
1	3	68	t	2023-03-28 20:25:27.215632	2024-09-24 13:20:52.47348
1	3	73	t	2023-03-28 23:02:54.205397	2024-09-24 13:20:52.47348
2	133	101	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	41	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	210	72	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	133	70	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	3	75	t	2023-03-28 23:02:54.228093	2024-09-24 13:20:52.47348
2	133	76	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	106	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	34	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	36	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	72	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	35	t	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	236	34	f	2023-06-23 16:41:41.71735	2024-03-25 18:38:48.029326
2	238	166	t	2023-11-02 00:07:15.735854	2024-06-11 22:41:36.531361
2	210	133	f	2023-08-28 14:21:19.324639	2023-11-02 00:23:43.739976
2	238	133	t	2023-08-28 14:21:19.324639	2024-06-11 22:41:36.531361
1	8	133	f	2023-08-28 14:21:19.324639	2024-04-30 20:47:16.441868
2	5	133	t	2023-08-28 14:21:19.324639	2024-06-03 23:48:48.979652
1	37	133	t	2023-08-28 14:21:19.324639	2024-04-30 21:14:38.439234
1	237	166	f	2023-11-02 00:07:15.735854	2024-03-25 18:38:44.266675
1	237	133	f	2023-08-28 14:21:19.324639	2024-03-25 18:38:44.266675
1	236	166	f	2023-11-02 00:07:15.735854	2024-03-25 18:38:48.029326
1	236	133	f	2023-08-28 14:21:19.324639	2024-03-25 18:38:48.029326
1	235	166	f	2023-11-02 00:07:15.735854	2024-03-25 18:38:51.321478
1	235	133	f	2023-08-28 14:21:19.324639	2024-03-25 18:38:51.321478
2	233	133	f	2023-08-28 14:21:19.324639	2024-03-25 18:38:54.231719
1	212	133	f	2023-08-28 14:21:19.324639	2024-03-25 18:38:57.903524
1	233	68	f	2023-06-23 16:24:01.942211	2024-06-13 20:40:02.986073
1	210	133	t	2023-08-28 14:21:19.324639	2025-01-06 21:47:07.36144
1	5	133	t	2023-08-28 14:21:19.324639	2024-06-03 23:48:48.979652
2	3	166	t	2023-11-02 00:07:15.735854	2024-09-24 13:20:52.47348
2	11	133	f	2023-08-28 14:21:19.324639	2024-06-03 22:46:23.851994
1	11	133	t	2023-08-28 14:21:19.324639	2024-06-03 22:46:23.851994
2	3	133	t	2023-08-28 14:21:19.324639	2024-09-24 13:20:52.47348
1	3	41	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
1	3	76	t	2023-03-28 23:02:55.018857	2024-09-24 13:20:52.47348
1	3	106	t	2023-04-10 14:20:51.65205	2024-09-24 13:20:52.47348
1	3	34	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
1	3	36	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
1	3	166	t	2023-11-02 00:07:15.735854	2024-09-24 13:20:52.47348
1	3	72	t	2023-03-28 20:25:27.281633	2024-09-24 13:20:52.47348
1	3	133	t	2023-08-28 14:21:19.324639	2024-09-24 13:20:52.47348
1	3	35	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
1	4	68	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	73	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	75	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	74	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	102	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	100	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
1	4	67	f	2023-04-11 22:43:23.883276	2025-01-07 17:52:19.372122
2	37	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
1	9	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
2	12	133	t	2023-08-28 14:21:19.324639	2024-06-04 18:12:42.838897
1	12	133	t	2023-08-28 14:21:19.324639	2024-06-04 18:12:42.838897
2	9	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
1	6	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
2	6	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
2	8	133	t	2023-08-28 14:21:19.324639	2023-08-28 14:21:19.324639
2	210	35	f	2023-04-11 23:22:38.838104	2023-11-02 00:23:43.739976
2	133	72	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
2	133	133	f	2023-08-28 14:21:19.324639	2024-05-30 17:42:17.919325
2	133	35	f	2023-06-08 20:58:06.926997	2024-05-30 17:42:17.919325
1	133	133	t	2023-08-28 14:21:19.324639	2024-05-30 17:42:17.919325
2	37	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
2	238	68	f	2023-11-13 18:05:58.148759	2024-06-13 20:40:02.986073
1	210	166	t	2023-11-02 00:07:15.735854	2025-01-06 21:47:07.36144
1	9	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
2	9	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
1	6	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
2	6	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
2	11	166	f	2023-11-02 00:07:15.735854	2024-06-03 22:46:23.851994
1	4	166	t	2023-11-02 00:07:15.735854	2025-01-07 17:52:19.372122
1	4	133	t	2023-08-28 14:21:19.324639	2025-01-07 17:52:19.372122
2	8	166	t	2023-11-02 00:07:15.735854	2023-11-02 00:07:15.735854
2	210	166	f	2023-11-02 00:07:15.735854	2023-11-02 00:23:43.739976
1	233	73	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	75	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	74	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	40	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	102	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	100	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	67	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	71	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	101	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	41	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	70	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	76	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	106	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	34	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	36	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	166	f	2023-11-02 00:07:15.735854	2023-11-02 00:23:58.188784
1	233	72	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
1	233	133	f	2023-08-28 14:21:19.324639	2023-11-02 00:23:58.188784
1	233	35	f	2023-06-23 16:24:01.942211	2023-11-02 00:23:58.188784
2	3	75	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	74	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
2	3	40	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
195	3	72	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	133	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	35	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
1	11	73	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	75	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
2	12	166	t	2023-11-02 00:07:15.735854	2024-06-04 18:12:42.838897
1	12	166	t	2023-11-02 00:07:15.735854	2024-06-04 18:12:42.838897
1	8	166	f	2023-11-02 00:07:15.735854	2024-04-30 20:47:16.441868
2	5	166	t	2023-11-02 00:07:15.735854	2024-06-03 23:48:48.979652
1	37	166	t	2023-11-02 00:07:15.735854	2024-04-30 21:14:38.439234
2	233	166	f	2023-11-02 00:07:15.735854	2024-03-25 18:38:54.231719
1	212	166	f	2023-11-02 00:07:15.735854	2024-03-25 18:38:57.903524
2	238	73	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	75	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
1	11	74	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	11	166	t	2023-11-02 00:07:15.735854	2024-06-03 22:46:23.851994
2	238	74	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	102	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
2	238	100	f	2023-11-13 18:05:58.148759	2024-03-25 18:39:03.602757
1	11	35	t	2023-04-06 18:54:24.122316	2024-06-03 22:46:23.851994
1	5	166	t	2023-11-02 00:07:15.735854	2024-06-03 23:48:48.979652
2	133	166	t	2023-11-02 00:07:15.735854	2024-05-30 17:42:17.919325
1	133	166	t	2023-11-02 00:07:15.735854	2024-05-30 17:42:17.919325
2	3	35	t	2023-04-04 15:12:45.113689	2024-09-24 13:20:52.47348
195	3	68	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	73	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	74	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	40	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	67	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	71	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	101	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	41	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	70	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	106	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	34	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	36	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
195	3	166	t	2024-06-03 15:34:40.595923	2024-09-24 13:20:52.47348
\.


--
-- Data for Name: fid; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fid (id) FROM stdin;
34
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, created_at, updated_at, is_active) FROM stdin;
2	Ilium	2022-04-10 21:28:58.99069	2024-06-04 15:00:30.958077	t
1	Ithaka	2022-04-10 20:41:44.401521	2024-06-04 15:00:33.497466	t
195	New Group	2024-06-03 15:34:40.597006	2024-06-06 17:37:44.625686	t
\.


--
-- Data for Name: groups_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups_entities (id, group_id, entity_id, role, updated_at) FROM stdin;
4	1	5	admin	2023-03-31 12:23:26.225905
5	1	6	admin	2023-03-31 12:23:26.225905
6	1	12	admin	2023-03-31 12:23:26.225905
7	1	7	admin	2023-03-31 12:23:26.225905
9	1	9	admin	2023-03-31 12:23:26.225905
10	1	10	admin	2023-03-31 12:23:26.225905
11	1	11	admin	2023-03-31 12:23:26.225905
12	2	12	admin	2023-03-31 12:23:26.225905
13	2	7	admin	2023-03-31 12:23:26.225905
34	1	34	admin	2023-03-31 12:23:26.225905
35	2	34	admin	2023-03-31 12:23:26.225905
376	195	3	removed	2024-06-06 17:37:32.993865
38	1	37	admin	2023-03-31 12:23:26.225905
39	2	37	admin	2023-03-31 12:23:26.225905
381	195	3	removed	2024-06-06 17:37:32.993865
382	195	3	removed	2024-06-06 17:37:32.993865
383	195	3	removed	2024-06-06 17:37:32.993865
386	195	3	removed	2024-06-06 17:37:32.993865
389	195	12	removed	2024-06-06 17:37:32.993865
390	195	3	removed	2024-06-06 17:37:32.993865
2	2	3	admin	2024-05-02 15:07:16.867616
133	1	133	admin	2023-03-31 12:23:26.225905
391	195	3	admin	2024-06-06 17:37:44.623893
392	1	375	\N	2024-06-07 16:07:24.175936
397	2	3	admin	2024-09-24 12:57:07.824769
398	1	3	admin	2024-09-24 12:57:07.824769
399	195	3	admin	2024-09-24 12:57:07.824769
197	2	5	admin	2023-04-06 16:19:23.870617
199	2	6	admin	2023-04-06 18:52:46.999216
200	2	8	admin	2023-04-06 18:53:24.509148
201	2	9	admin	2023-04-06 18:53:47.877498
1	1	3	admin	2023-04-10 22:41:15.292259
232	2	133	admin	2024-05-30 17:42:17.919325
14	2	11	admin	2024-06-03 22:46:23.851994
377	1	3	admin	2024-06-04 15:00:23.309934
378	2	3	admin	2024-06-04 15:00:27.409074
379	2	3	admin	2024-06-04 15:00:30.956937
380	1	3	admin	2024-06-04 15:00:33.496444
384	2	3	admin	2024-06-04 18:12:27.035155
385	1	3	admin	2024-06-04 18:12:27.035155
3	1	4	user	2023-04-12 17:33:23.983902
387	2	12	admin	2024-06-04 18:12:42.838897
388	1	12	admin	2024-06-04 18:12:42.838897
217	1	210	user	2023-08-28 14:42:10.252179
216	2	210	user	2023-11-02 00:23:43.739976
235	1	233	user	2023-11-02 00:23:58.188784
240	1	237	\N	2024-03-25 18:38:44.266675
239	1	236	\N	2024-03-25 18:38:48.029326
238	1	235	\N	2024-03-25 18:38:51.321478
241	2	233	\N	2024-03-25 18:38:54.231719
218	1	212	\N	2024-03-25 18:38:57.903524
305	1	305	user	2024-03-25 18:39:31.668595
242	2	238	user	2024-03-25 18:39:03.602757
8	1	8	removed	2024-04-30 20:47:16.441868
\.


--
-- Data for Name: ip_bypass; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ip_bypass (id, facility_id, ip, created_at) FROM stdin;
2	4	100.37.246.4	2022-05-09 18:24:58.415494
3	4	67.243.68.187	2022-05-09 18:25:06.570837
4	4	148.75.247.96	2022-05-09 18:25:14.61438
5	4	67.167.189.151	2022-05-10 17:26:21.18813
6	4	68.49.111.43	2022-05-12 15:01:05.010074
7	4	148.75.247.96	2022-05-12 15:38:38.469859
9	4	24.47.48.132	2022-05-16 17:29:35.689219
34	4	68.46.171.29	2022-06-06 19:47:37.099775
35	36	165.189.131.200	2022-07-11 15:44:52.085014
36	36	165.189.131.201	2022-07-11 15:46:08.675799
37	36	165.189.131.202	2022-07-11 15:46:11.162549
38	36	165.189.132.203	2022-07-11 15:47:01.181624
1	4	70.229.195.135	2022-05-03 15:32:08.997169
39	36	165.189.255.29	2022-07-20 23:54:11.650525
40	36	165.189.255.28	2022-07-20 23:54:15.511786
67	67	156.108.217.2	2022-07-22 17:12:06.456338
68	4	50.250.14.94	2022-08-04 20:33:32.853106
100	4	73.154.113.78	2022-08-18 18:40:48.942537
232	4	172.56.105.18	2024-09-19 21:27:56.233455
233	4	2607:fb91:1593:a483:171:71c:5221:5336	2024-09-19 21:40:42.734211
265	4	76.144.153.252	2024-11-14 18:46:08.438018
166	4	76.144.153.253	2023-08-07 17:19:36.116435
\.


--
-- Data for Name: status_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.status_details (id, status_id, type, detail) FROM stdin;
793	2476	reason	Missing required information
794	2476	comments	Include name
795	2477	reason	Missing required information
796	2477	comments	Include name
797	2478	reason	Missing required information
798	2478	comments	Include name
826	2509	reason	Missing required information
827	2509	comments	Test
731	2391	reason	Sexually explicit/pornographic
732	2391	comments	Test
735	2393	reason	Sexually explicit/pornographic
736	2393	comments	Test
737	2397	reason	Sexually explicit/pornographic
738	2397	comments	test
741	2399	reason	Sexually explicit/pornographic
742	2399	comments	test
743	2403	reason	Sexually explicit/pornographic
744	2403	comments	test
747	2405	reason	Sexually explicit/pornographic
748	2405	comments	test
749	2409	reason	Sexually explicit/pornographic
750	2409	comments	test
753	2411	reason	Sexually explicit/pornographic
754	2411	comments	test
755	2415	reason	Sexually explicit/pornographic
756	2415	comments	test
759	2417	reason	Sexually explicit/pornographic
760	2417	comments	test
761	2421	reason	Sexually explicit/pornographic
762	2421	comments	test
765	2423	reason	Sexually explicit/pornographic
766	2423	comments	test
767	2427	reason	Sexually explicit/pornographic
768	2427	comments	test
771	2429	reason	Sexually explicit/pornographic
772	2429	comments	test
773	2433	reason	Sexually explicit/pornographic
774	2433	comments	test
777	2435	reason	Sexually explicit/pornographic
778	2435	comments	test
799	2479	reason	Missing required information
800	2479	comments	Include name
801	2480	reason	Missing required information
802	2480	comments	Include name
\.


--
-- Data for Name: statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.statuses (id, entity_id, jstor_item_id, jstor_item_type, status, group_id, created_at) FROM stdin;
2344	238	10.2307/48766011	doi	Pending	2	2024-06-11 22:34:04.91869
2345	238	10.2307/48756020	doi	Pending	2	2024-06-11 22:34:04.94563
2346	238	10.2307/48756018	doi	Pending	2	2024-06-11 22:34:04.949068
2452	4	10.2307/48766013	doi	Pending	1	2024-10-31 18:57:57.701019
2347	3	10.2307/48756020	doi	Approved	2	2024-06-11 22:34:26.372325
2453	4	10.2307/48766021	doi	Pending	1	2024-10-31 18:58:58.526811
2348	3	10.2307/48756020	doi	Approved	195	2024-06-11 22:34:26.376047
2454	4	10.2307/48756018	doi	Pending	1	2024-10-31 19:02:25.459263
2455	4	10.2307/48756019	doi	Pending	1	2024-10-31 19:05:22.138455
2456	4	10.2307/48766023	doi	Pending	1	2024-10-31 19:05:47.620814
2457	4	10.2307/48756016	doi	Pending	1	2024-10-31 19:05:47.624042
2476	3	10.2307/48766013	doi	Denied	2	2024-12-05 15:49:09.948128
2349	3	10.2307/resrep53846	doi	Approved	2	2024-06-11 22:34:30.518135
2477	3	10.2307/48766013	doi	Denied	1	2024-12-05 15:49:09.977599
2351	3	10.2307/resrep53846	doi	Approved	195	2024-06-11 22:34:30.527349
2352	3	10.2307/resrep53866	doi	Approved	2	2024-06-11 22:34:32.807131
2478	3	10.2307/48766013	doi	Denied	195	2024-12-05 15:49:09.98372
2354	3	10.2307/resrep53866	doi	Approved	195	2024-06-11 22:34:32.811386
2509	133	10.2307/48756019	doi	Incomplete	1	2024-12-05 18:10:18.394045
2542	3	africanamericanstudies-discipline	discipline	Denied	1	2025-01-07 18:16:19.671952
2543	3	africanamericanstudies-discipline	discipline	Denied	2	2025-01-07 18:19:14.182633
2544	3	africanamericanstudies-discipline	discipline	Denied	195	2025-01-07 18:19:14.186287
2437	238	10.2307/48766024	doi	Pending	2	2024-09-19 15:55:50.321464
2458	4	10.2307/48766022	doi	Pending	1	2024-10-31 19:16:50.744528
2459	4	10.2307/48766015	doi	Pending	1	2024-10-31 19:16:50.751378
2479	3	10.2307/48756018	doi	Denied	2	2024-12-05 15:50:39.0108
2480	3	10.2307/48756018	doi	Denied	1	2024-12-05 15:50:39.018474
2510	4	10.2307/48798757	doi	Pending	1	2024-12-05 19:40:48.22886
2511	4	10.2307/48766013	doi	Pending	1	2024-12-05 19:40:48.233798
2512	4	10.2307/48798750	doi	Pending	1	2024-12-05 19:40:48.236411
2545	3	africanamericanstudies-discipline	discipline	Approved	1	2025-01-07 18:19:29.501621
2513	4	10.2307/jj.10121667.67	doi	Pending	1	2024-12-05 19:41:06.018018
2389	3	10.2307/48756018	doi	Approved	2	2024-09-17 18:52:27.002401
2514	4	10.2307/jj.10121667.100	doi	Pending	1	2024-12-05 19:41:06.029575
2515	4	10.2307/jj.10121667.74	doi	Pending	1	2024-12-05 19:41:06.037422
2516	3	africanamericanstudies-discipline	discipline	Approved	2	2024-12-05 19:41:28.06455
2517	3	africanamericanstudies-discipline	discipline	Approved	1	2024-12-05 19:41:28.06455
2518	3	africanamericanstudies-discipline	discipline	Approved	195	2024-12-05 19:41:28.06455
2390	3	10.2307/48756018	doi	Approved	195	2024-09-17 18:52:27.010384
2391	3	10.2307/48756018	doi	Denied	2	2024-09-17 18:52:38.973988
2393	3	10.2307/48756018	doi	Denied	195	2024-09-17 18:52:38.993007
2394	3	10.2307/48756018	doi	Approved	2	2024-09-17 18:52:57.498587
2396	3	10.2307/48756018	doi	Approved	195	2024-09-17 18:52:57.506489
2397	3	10.2307/48756018	doi	Denied	2	2024-09-17 18:53:08.33871
2399	3	10.2307/48756018	doi	Denied	195	2024-09-17 18:53:08.352532
2400	3	10.2307/48756018	doi	Approved	2	2024-09-17 18:54:19.452727
2402	3	10.2307/48756018	doi	Approved	195	2024-09-17 18:54:19.460469
2403	3	10.2307/48756018	doi	Denied	2	2024-09-17 18:57:25.438905
2405	3	10.2307/48756018	doi	Denied	195	2024-09-17 18:57:25.452601
2406	3	10.2307/48756018	doi	Approved	2	2024-09-17 18:57:43.427518
2408	3	10.2307/48756018	doi	Approved	195	2024-09-17 18:57:43.434606
2409	3	10.2307/48756018	doi	Denied	2	2024-09-17 19:03:38.227828
2411	3	10.2307/48756018	doi	Denied	195	2024-09-17 19:03:38.241643
2412	3	10.2307/48756018	doi	Approved	2	2024-09-17 19:04:33.702606
2414	3	10.2307/48756018	doi	Approved	195	2024-09-17 19:04:33.711679
2415	3	10.2307/48756018	doi	Denied	2	2024-09-17 19:05:12.142554
2417	3	10.2307/48756018	doi	Denied	195	2024-09-17 19:05:12.1565
2418	3	10.2307/48756018	doi	Approved	2	2024-09-17 19:06:05.02848
2420	3	10.2307/48756018	doi	Approved	195	2024-09-17 19:06:05.036808
2421	3	10.2307/48756018	doi	Denied	2	2024-09-17 19:06:25.021262
2423	3	10.2307/48756018	doi	Denied	195	2024-09-17 19:06:25.039473
2424	3	10.2307/48756018	doi	Approved	2	2024-09-17 19:07:38.296577
2426	3	10.2307/48756018	doi	Approved	195	2024-09-17 19:07:38.303474
2427	3	10.2307/48756018	doi	Denied	2	2024-09-17 19:07:51.42608
2429	3	10.2307/48756018	doi	Denied	195	2024-09-17 19:07:51.439997
2430	3	10.2307/48756018	doi	Approved	2	2024-09-17 19:08:34.376701
2432	3	10.2307/48756018	doi	Approved	195	2024-09-17 19:08:34.384754
2433	3	10.2307/48756018	doi	Denied	2	2024-09-17 19:08:47.577391
2435	3	10.2307/48756018	doi	Denied	195	2024-09-17 19:08:47.592908
2436	238	10.2307/48756018	doi	Pending	2	2024-09-19 15:28:37.544429
\.


--
-- Data for Name: subdomains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subdomains (id, subdomain, entity_type, is_active, created_at, updated_at) FROM stdin;
1	pep	facilities	t	2023-08-18 15:46:29.157637	2023-08-18 15:46:29.157637
2	test1-pep	facilities	t	2023-08-18 15:46:29.157637	2023-08-18 15:46:29.157637
35	test3-pep	facilities	t	2024-06-06 18:58:56.486817	2024-06-07 16:54:03.10581
3	test2-pep	facilities	t	2023-08-24 15:40:04.129401	2024-06-11 19:01:58.91413
\.


--
-- Data for Name: subdomains_facilities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subdomains_facilities (subdomain, sitecode, facility_id, created_at, updated_at) FROM stdin;
test1-pep	test	4	2024-12-09 23:08:02.306139	2025-01-07 17:52:19.372122
\.


--
-- Data for Name: tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens (id, token, is_active, created_at, updated_at) FROM stdin;
20	99999002663514	t	2023-10-11 22:19:01.169442	2023-10-11 22:19:01.169442
21	99999002911655	t	2023-10-11 22:19:01.174392	2023-10-11 22:19:01.174392
22	99999002911656	t	2023-10-11 22:19:01.181888	2023-10-11 22:19:01.181888
23	99999002911657	t	2023-10-11 22:19:01.187412	2023-10-11 22:19:01.187412
24	123959834548865	t	2023-10-11 22:19:01.191789	2023-10-11 22:19:01.191789
26	59331631	t	2023-10-11 22:19:01.200689	2023-10-11 22:19:01.200689
28	99999002911658	t	2023-10-11 22:19:01.209061	2023-10-11 22:19:01.209061
29	99999002911659	t	2023-10-11 22:19:01.213443	2023-10-11 22:19:01.213443
30	99999003098235	t	2023-10-11 22:19:01.217661	2023-10-11 22:19:01.217661
31	69743521	t	2023-10-11 22:19:01.221779	2023-10-11 22:19:01.221779
32	57941481	t	2023-10-11 22:19:01.226603	2023-10-11 22:19:01.226603
33	123959835214525	t	2023-10-11 22:19:01.231382	2023-10-11 22:19:01.231382
34	123959836119195	t	2023-10-11 22:19:01.236298	2023-10-11 22:19:01.236298
36	123959837192274	t	2023-10-11 22:19:01.246994	2023-10-11 22:19:01.246994
35	123959836127525	t	2023-10-11 22:19:01.241377	2023-10-12 15:42:54.193628
67	123959837441365	t	2024-04-16 16:01:07.348451	2024-04-16 16:01:07.348451
39	2148400	t	2023-10-12 15:45:59.928163	2023-10-12 15:45:59.928163
40	56060111	t	2023-10-12 16:07:55.183343	2023-10-12 16:07:55.183343
41	99999002908895	t	2023-10-12 16:07:55.195492	2023-10-12 16:07:55.195492
42	99999002908894	t	2023-10-12 16:07:55.204906	2023-10-12 16:07:55.204906
43	123959834542275	t	2023-10-12 16:07:55.215099	2023-10-12 16:07:55.215099
44	123959834683745	t	2023-10-12 16:07:55.224531	2023-10-12 16:07:55.224531
45	99999002908897	t	2023-10-12 16:07:55.233479	2023-10-12 16:07:55.233479
46	99999002908896	t	2023-10-12 16:07:55.243068	2023-10-12 16:07:55.243068
48	99999002908899	t	2023-10-12 16:07:55.261523	2023-10-12 16:07:55.261523
49	99999002908898	t	2023-10-12 16:07:55.270794	2023-10-12 16:07:55.270794
50	123959837176234	t	2023-10-12 16:07:55.279936	2023-10-12 16:07:55.279936
51	123959836388485	t	2023-10-12 16:07:55.290023	2023-10-12 16:07:55.290023
52	123959835497695	t	2023-10-12 16:07:55.299245	2023-10-12 16:07:55.299245
53	123959837599969	t	2023-10-12 16:07:55.308345	2023-10-12 16:07:55.308345
54	123959837191798	t	2023-10-12 16:07:55.317494	2023-10-12 16:07:55.317494
55	123959836342725	t	2023-10-12 16:07:55.328031	2023-10-12 16:07:55.328031
56	123959834556855	t	2023-10-12 16:07:55.3373	2023-10-12 16:07:55.3373
57	99999002911660	t	2023-10-12 16:07:55.346713	2023-10-12 16:07:55.346713
58	20	t	2023-10-12 16:07:55.355951	2023-10-12 16:07:55.355951
27	337284975	f	2023-10-11 22:19:01.204944	2024-08-07 20:27:39.148217
25	123959837464482	f	2023-10-11 22:19:01.196133	2024-08-07 20:27:39.148217
38	000000000000000000000000000000	f	2023-10-12 15:33:23.105505	2024-08-07 20:27:39.148217
47	18	f	2023-10-12 16:07:55.252531	2024-08-07 20:27:39.148217
\.


--
-- Data for Name: ungrouped_features; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ungrouped_features (id, name, display_name, category, description, created_at, updated_at, is_active) FROM stdin;
1	add_group	Add Group	Groups	Allows user to add a group to the system.	2024-05-22 16:05:14.875919	2024-05-22 16:05:14.875919	t
2	edit_group	Edit Group	Groups	Allows user to edit a group in the system.	2024-05-22 16:05:14.875919	2024-05-22 16:05:14.875919	t
3	delete_group	Delete Group	Groups	Allows user to delete a group from the system.	2024-05-22 16:05:14.875919	2024-05-22 16:05:14.875919	t
4	clear_history	Clear Media Review History	Groups	Allows a user to completely clear the entire media review history for a group.	2024-05-22 16:05:14.875919	2024-05-22 16:05:14.875919	t
34	manage_superusers	Manage Users	Users	Allows a user to manage features for existing users or add new ones.	2024-05-31 14:07:56.46218	2024-05-31 14:07:56.46218	t
35	create_group_admins	Create Group Admins	Users	Allows a user make any user an administrator for all existing groups.	2024-06-04 18:09:08.624221	2024-06-04 18:09:08.624221	t
36	add_subdomain	Add Subdomain	Subdomains	Allows user to add a subdomain to the system.	2024-06-06 15:00:48.781841	2024-06-06 15:00:48.781841	t
37	edit_subdomain	Edit Subdomain	Subdomains	Allows user to edit a subdomain in the system.	2024-06-06 15:00:48.781841	2024-06-06 15:00:48.781841	t
38	delete_subdomain	Delete Subdomain	Subdomains	Allows user to delete a subdomain from the system.	2024-06-06 15:00:48.781841	2024-06-06 15:00:48.781841	t
67	add_ungrouped_feature	Add Ungrouped Feature	Ungrouped Features	Allows user to add a superuser-level feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
68	edit_ungrouped_feature	Edit Ungrouped Feature	Ungrouped Features	Allows user to edit a superuser-level feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
69	delete_ungrouped_feature	Delete Ungrouped Feature	Ungrouped Features	Allows user to delete a superuser-level feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
71	edit_feature	Edit Feature	Features	Allows user to edit a superuser-level feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
72	delete_feature	Delete Feature	Features	Allows user to delete a superuser-level feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
70	add_feature	Add Feature	Features	Allows user to add a feature.	2024-06-10 22:32:37.371149	2024-06-10 22:32:37.371149	t
95	test_feature_2	Test Feature 2	Testing	This is a test feature.	2024-06-12 15:56:03.834291	2024-06-12 15:56:03.834291	t
96	test_feature_3	Test Feature 3	Testing	This is a test feature.	2024-06-12 15:57:03.617215	2024-06-12 15:57:03.617215	t
93	test_feature_1	Test Feature 1	Testing	This is a test feature.	2024-06-12 15:55:07.555156	2024-06-13 21:31:00.646494	t
\.


--
-- Data for Name: ungrouped_features_entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ungrouped_features_entities (id, feature_id, entity_id, enabled, created_at, updated_at) FROM stdin;
66	1	5	f	2024-06-03 23:48:09.955649	2024-06-03 23:48:48.979652
67	4	5	f	2024-06-03 23:48:09.955649	2024-06-03 23:48:48.979652
68	3	5	f	2024-06-03 23:48:09.955649	2024-06-03 23:48:48.979652
69	2	5	f	2024-06-03 23:48:09.955649	2024-06-03 23:48:48.979652
70	34	5	f	2024-06-03 23:48:09.955649	2024-06-03 23:48:48.979652
136	70	3	t	2024-06-10 22:35:07.669122	2024-09-24 13:20:52.47348
1	1	3	t	2024-05-22 16:05:58.585152	2024-09-24 13:20:52.47348
130	36	3	t	2024-06-06 15:11:02.521854	2024-09-24 13:20:52.47348
133	67	3	t	2024-06-10 22:34:56.249485	2024-09-24 13:20:52.47348
4	4	3	t	2024-05-22 16:06:09.370323	2024-09-24 13:20:52.47348
117	35	3	t	2024-06-04 18:09:52.70862	2024-09-24 13:20:52.47348
138	72	3	t	2024-06-10 22:35:12.305275	2024-09-24 13:20:52.47348
3	3	3	t	2024-05-22 16:06:06.214272	2024-09-24 13:20:52.47348
132	38	3	t	2024-06-06 15:11:08.433327	2024-09-24 13:20:52.47348
135	69	3	t	2024-06-10 22:35:04.052186	2024-09-24 13:20:52.47348
137	71	3	t	2024-06-10 22:35:09.957012	2024-09-24 13:20:52.47348
2	2	3	t	2024-05-22 16:06:03.219448	2024-09-24 13:20:52.47348
131	37	3	t	2024-06-06 15:11:04.98045	2024-09-24 13:20:52.47348
134	68	3	t	2024-06-10 22:35:01.675343	2024-09-24 13:20:52.47348
35	34	3	t	2024-05-31 14:09:11.231298	2024-09-24 13:20:52.47348
190	93	3	t	2024-06-12 15:55:07.555156	2024-09-24 13:20:52.47348
191	95	3	t	2024-06-12 15:56:03.834291	2024-09-24 13:20:52.47348
192	96	3	t	2024-06-12 15:57:03.617215	2024-09-24 13:20:52.47348
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (jstor_id, id, updated_at) FROM stdin;
ryan.mccarthy@ithaka.org	3	2023-03-31 01:39:16.340415
jessica.smith@ithaka.org	7	2023-03-31 01:39:16.340415
jessica.pokharel@ithaka.org	12	2023-03-31 01:39:16.340415
stacy.burnett@ithaka.org	5	2023-03-31 01:39:16.340415
laura.brown@ithaka.org	8	2023-03-31 01:39:16.340415
ronald.snyder@ithaka.org	9	2023-03-31 01:39:16.340415
julia.ha@ithaka.org	11	2023-03-31 01:39:16.340415
cameronheard@icloud.com	34	2023-03-31 01:39:16.340415
andromeda.yelton@ithaka.org	37	2023-03-31 01:39:16.340415
ryan.mccarthy+1@ithaka.org	133	2023-03-31 01:39:16.340415
alex.humphreys@ithaka.org	6	2023-04-06 19:14:40.299894
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 66, true);


--
-- Name: entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entities_id_seq', 396, true);


--
-- Name: features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.features_id_seq', 264, true);


--
-- Name: groups_entitites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_entitites_id_seq', 429, true);


--
-- Name: groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.groups_id_seq', 198, true);


--
-- Name: ip_bypass_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ip_bypass_id_seq', 297, true);


--
-- Name: status_details_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.status_details_id_seq', 858, true);


--
-- Name: statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.statuses_id_seq', 2574, true);


--
-- Name: subdomains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subdomains_id_seq', 66, true);


--
-- Name: tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_id_seq', 99, true);


--
-- Name: ungrouped_features_entities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ungrouped_features_entities_id_seq', 330, true);


--
-- Name: ungrouped_features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ungrouped_features_id_seq', 99, true);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_jstor_id_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_jstor_id_uq UNIQUE (jstor_id);


--
-- Name: features features_display_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_display_name_key UNIQUE (display_name);


--
-- Name: features_groups_entities features_groups_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features_groups_entities
    ADD CONSTRAINT features_groups_entities_pkey PRIMARY KEY (group_id, entity_id, feature_id);


--
-- Name: features features_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_name_key UNIQUE (name);


--
-- Name: features features_name_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_name_uq UNIQUE (name);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: groups_entities groups_entitites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entitites_pkey PRIMARY KEY (id);


--
-- Name: groups groups_name_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_name_uq UNIQUE (name);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: ip_bypass ip_bypass_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_bypass
    ADD CONSTRAINT ip_bypass_pkey PRIMARY KEY (id);


--
-- Name: facilities pk_facilities; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT pk_facilities PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: status_details status_details_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_details
    ADD CONSTRAINT status_details_pkey PRIMARY KEY (id);


--
-- Name: statuses statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_pkey PRIMARY KEY (id);


--
-- Name: subdomains_facilities subdomains_facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_pkey PRIMARY KEY (subdomain, sitecode);


--
-- Name: subdomains subdomains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains
    ADD CONSTRAINT subdomains_pkey PRIMARY KEY (id);


--
-- Name: subdomains subdomains_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains
    ADD CONSTRAINT subdomains_subdomain_key UNIQUE (subdomain);


--
-- Name: tokens tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens
    ADD CONSTRAINT tokens_pkey PRIMARY KEY (id);


--
-- Name: ungrouped_features ungrouped_features_display_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_display_name_key UNIQUE (display_name);


--
-- Name: ungrouped_features_entities ungrouped_features_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_pkey PRIMARY KEY (feature_id, entity_id);


--
-- Name: ungrouped_features ungrouped_features_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_name_key UNIQUE (name);


--
-- Name: ungrouped_features ungrouped_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features
    ADD CONSTRAINT ungrouped_features_pkey PRIMARY KEY (id);


--
-- Name: users users_jstor_id_uq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_jstor_id_uq UNIQUE (jstor_id);


--
-- Name: groups_entitites_id_group_id_entity_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX groups_entitites_id_group_id_entity_id_idx ON public.groups_entities USING btree (id, group_id, entity_id);


--
-- Name: statuses_id_jstor_item_id_jstor_item_type_status_group_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX statuses_id_jstor_item_id_jstor_item_type_status_group_idx ON public.statuses USING btree (id, jstor_item_id, jstor_item_type, status, group_id);


--
-- Name: ungrouped_features_entities_id_feature_id_entity_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ungrouped_features_entities_id_feature_id_entity_id_idx ON public.ungrouped_features_entities USING btree (id, feature_id, entity_id);


--
-- Name: facilities facilities_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_id_fkey FOREIGN KEY (id) REFERENCES public.entities(id);


--
-- Name: groups_entities groups_entitites_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entitites_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: groups_entities groups_entitites_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups_entities
    ADD CONSTRAINT groups_entitites_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: ip_bypass ip_bypass_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_bypass
    ADD CONSTRAINT ip_bypass_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: status_details status_details_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.status_details
    ADD CONSTRAINT status_details_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.statuses(id);


--
-- Name: statuses statuses_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: statuses statuses_group_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.statuses
    ADD CONSTRAINT statuses_group_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: subdomains_facilities subdomains_facilities_facility_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_facility_id_fkey FOREIGN KEY (facility_id) REFERENCES public.facilities(id);


--
-- Name: subdomains_facilities subdomains_facilities_subdomain_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subdomains_facilities
    ADD CONSTRAINT subdomains_facilities_subdomain_fkey FOREIGN KEY (subdomain) REFERENCES public.subdomains(subdomain);


--
-- Name: ungrouped_features_entities ungrouped_features_entities_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(id);


--
-- Name: ungrouped_features_entities ungrouped_features_entities_feature_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ungrouped_features_entities
    ADD CONSTRAINT ungrouped_features_entities_feature_id_fkey FOREIGN KEY (feature_id) REFERENCES public.ungrouped_features(id);


--
-- Name: users users_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES public.entities(id);


--
-- Name: users users_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_id_fkey1 FOREIGN KEY (id) REFERENCES public.entities(id);


--
-- Name: DATABASE jaip; Type: ACL; Schema: -; Owner: postgres
--

GRANT CONNECT ON DATABASE jaip TO jaip_reader;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: rdsadmin
--

REVOKE ALL ON SCHEMA public FROM rdsadmin;
REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO jaip_reader;


--
-- Name: TABLE alerts; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.alerts TO jaip_reader;


--
-- Name: SEQUENCE alerts_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.alerts_id_seq TO jaip_writer;


--
-- Name: TABLE entities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.entities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.entities TO jaip_writer;

GRANT SELECT ON whole_entities TO jaip_writer;
--
-- Name: SEQUENCE entities_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.entities_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.entities_id_seq TO jaip_writer;


--
-- Name: TABLE facilities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.facilities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.facilities TO jaip_writer;


--
-- Name: TABLE features; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.features TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features TO jaip_writer;


--
-- Name: TABLE features_groups_entities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.features_groups_entities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.features_groups_entities TO jaip_writer;


--
-- Name: TABLE groups; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.groups TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups TO jaip_writer;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.users TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO jaip_writer;


--
-- Name: TABLE feature_lists_view; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.feature_lists_view TO jaip_reader;


--
-- Name: SEQUENCE features_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.features_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.features_id_seq TO jaip_writer;


--
-- Name: TABLE fid; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.fid TO jaip_reader;


--
-- Name: TABLE groups_entities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.groups_entities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.groups_entities TO jaip_writer;


--
-- Name: TABLE group_members_jstor_id_view; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.group_members_jstor_id_view TO jaip_reader;


--
-- Name: TABLE group_members_view; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.group_members_view TO jaip_reader;


--
-- Name: SEQUENCE groups_entitites_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.groups_entitites_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.groups_entitites_id_seq TO jaip_writer;


--
-- Name: SEQUENCE groups_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.groups_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.groups_id_seq TO jaip_writer;


--
-- Name: TABLE ip_bypass; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.ip_bypass TO jaip_reader;


--
-- Name: SEQUENCE ip_bypass_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.ip_bypass_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.ip_bypass_id_seq TO jaip_writer;


--
-- Name: TABLE status_details; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.status_details TO jaip_reader;
GRANT INSERT,DELETE,UPDATE ON TABLE public.status_details TO jaip_writer;


--
-- Name: SEQUENCE status_details_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.status_details_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.status_details_id_seq TO jaip_writer;


--
-- Name: TABLE statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.statuses TO jaip_reader;
GRANT INSERT,DELETE,UPDATE ON TABLE public.statuses TO jaip_writer;


--
-- Name: SEQUENCE statuses_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.statuses_id_seq TO jaip_reader;
GRANT SELECT,USAGE ON SEQUENCE public.statuses_id_seq TO jaip_writer;


--
-- Name: TABLE subdomains; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.subdomains TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains TO jaip_writer;


--
-- Name: TABLE subdomains_facilities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.subdomains_facilities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subdomains_facilities TO jaip_writer;


--
-- Name: SEQUENCE subdomains_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.subdomains_id_seq TO jaip_writer;


--
-- Name: TABLE tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.tokens TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.tokens TO jaip_writer;


--
-- Name: SEQUENCE tokens_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.tokens_id_seq TO jaip_writer;


--
-- Name: TABLE ungrouped_features; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.ungrouped_features TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features TO jaip_writer;


--
-- Name: TABLE ungrouped_features_entities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE public.ungrouped_features_entities TO jaip_reader;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.ungrouped_features_entities TO jaip_writer;


--
-- Name: SEQUENCE ungrouped_features_entities_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_entities_id_seq TO jaip_writer;


--
-- Name: SEQUENCE ungrouped_features_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.ungrouped_features_id_seq TO jaip_writer;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT ON TABLES  TO jaip_reader;


--
-- PostgreSQL database dump complete
--

