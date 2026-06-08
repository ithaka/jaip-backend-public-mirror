DO $$
BEGIN
   IF EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'jaip_writer_alt') THEN

      RAISE NOTICE 'Role "jaip_writer_alt" already exists. Skipping.';
   ELSE
      CREATE ROLE jaip_writer_alt;
   END IF;
END $$;

GRANT jaip_writer TO jaip_writer_alt;