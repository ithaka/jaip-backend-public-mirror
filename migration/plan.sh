# FIRST: Shut down the existing frontend Cloudfront Distribution

### 1. Drop JAIP DB: DROP DATABASE jaip;
### 2. Drop jaip_writer role: DROP ROLE jaip_writer;
### 3. Copy commands from ./db_setup.sql
### 4. Connect to JAIP Database: \c jaip
### 5. Copy commands from ./db_structure to create tables

# 6. DUMP Production from EC2
pg_dump -C  -h online-pep-postgres-cluster.cluster-cidtjzmppmrj.us-east-1.rds.amazonaws.com -p 5432 -U postgres online_pep_prod --data-only --format=t > prod.tar

# 7. SCP from local
scp -r -i ~/.ssh/ryan-aws.pem ec2-user@ec2-54-80-127-224.compute-1.amazonaws.com:prod.tar ~/Documents/jaip-backend/migration/prod.tar

# 8. RESTORE
pg_restore --host=jaip-prod-db-rdsdbinstance-sgu4ucbl9z7m.c8x4c5fq4lwc.us-east-1.rds.amazonaws.com --port=3306 --username=masterpostgresuser --password --dbname=jaip prod.tar

# 9. Copy commands from ./db_constraints.sql

# 10. DNS: sequoia terraform plan
# 11. DNS: sequoia terraform apply