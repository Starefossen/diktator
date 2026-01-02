#!/bin/bash
set -e

# Create multiple databases in PostgreSQL
# This script is run during PostgreSQL container initialization

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create test database if it doesn't exist
    SELECT 'CREATE DATABASE diktator_test'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'diktator_test')\gexec

    -- Grant privileges
    GRANT ALL PRIVILEGES ON DATABASE diktator TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE diktator_test TO $POSTGRES_USER;
EOSQL

echo "✅ Databases created: diktator (dev), diktator_test (test)"
