
-- PROCEDURES
CREATE OR REPLACE PROCEDURE add_feature(fid INT, is_enabled BOOLEAN, role_name user_roles)
 LANGUAGE plpgsql
AS $procedure$
  DECLARE
    eid int;
    gid int;
  BEGIN
    FOR gid IN SELECT group_id from groups_entities
    LOOP
      FOR eid IN SELECT entity_id from groups_entities WHERE group_id = gid AND role = role_name
      LOOP
        INSERT INTO features_groups_entities (feature_id, group_id, entity_id, enabled) VALUES (fid, gid, eid, is_enabled)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.add_admin_to_active_groups(IN uid integer)
 LANGUAGE plpgsql
AS $procedure$
  DECLARE
    gid INT;
  BEGIN
  FOR gid IN SELECT id FROM groups WHERE is_active=true
  LOOP
    CALL add_group_admin(uid, gid);
  END LOOP;
END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.add_facilities(IN fac json, IN is_manager boolean)
 LANGUAGE plpgsql
AS $procedure$
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
END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.add_group_admin(IN uid integer, IN gid integer)
 LANGUAGE plpgsql
AS $procedure$
  DECLARE
    fid INT;
  BEGIN
    INSERT INTO groups_entities (group_id, entity_id, role)
    VALUES (gid, uid, 'admin')
    ON CONFLICT ON CONSTRAINT groups_entities_pkey
    DO UPDATE
    SET role = EXCLUDED.role, updated_at = DEFAULT;

    FOR fid IN SELECT id FROM features
    LOOP
      INSERT INTO features_groups_entities (group_id, entity_id, feature_id, enabled) 
      VALUES (
        gid,
        uid,
        fid,
        true
      )
      ON CONFLICT ON CONSTRAINT features_groups_entities_pkey
      DO UPDATE
      SET enabled = EXCLUDED.enabled, updated_at = DEFAULT;
    END LOOP;
END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.add_users(IN usr json, IN is_manager boolean)
 LANGUAGE plpgsql
AS $procedure$
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
END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.deny_list(IN dois character varying[], IN entity_id integer, IN group_id integer)
 LANGUAGE plpgsql
AS $procedure$
  DECLARE
    stat RECORD;
    doi VARCHAR;
  BEGIN
    FOREACH doi IN ARRAY dois
    LOOP
      INSERT INTO statuses (entity_id, jstor_item_id, jstor_item_type, status, group_id)
        VALUES (entity_id, doi, 'doi', 'Denied', group_id) RETURNING id INTO stat;
      INSERT INTO status_details (status_id, type, detail) 
        VALUES (stat.id, 'reason', 'Sexually explicit/pornographic'), (stat.id, 'comments', 'Denied per request');
    END LOOP;      
  END;  $procedure$;

CREATE OR REPLACE PROCEDURE public.edit_facilities(IN fac json, IN is_manager boolean)
 LANGUAGE plpgsql
AS $procedure$
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
      RAISE NOTICE 'Subdomain: %', sd;
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
END; $procedure$;

CREATE OR REPLACE PROCEDURE public.edit_users(IN usr json, IN is_manager boolean)
 LANGUAGE plpgsql
AS $procedure$
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
END; $procedure$;
