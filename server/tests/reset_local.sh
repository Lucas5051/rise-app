#!/bin/sh
# Recrée la base locale de test et applique toutes les migrations
P="psql -h /tmp -p 5433 -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists usci" -c "create database usci" >/dev/null
$P -d usci -c "alter default privileges in schema public grant execute on functions to authenticated" >/dev/null 2>&1
psql -h /tmp -p 5433 -U postgres -d usci -q -f tests/supabase_stub.sql && psql -h /tmp -p 5433 -U postgres -d usci -q -c "alter default privileges in schema public grant execute on functions to authenticated, anon" && for f in migrations/001_schema.sql migrations/002_security.sql migrations/003_functions.sql migrations/005_seed.sql migrations/006_coach_writes.sql migrations/007_pain_date.sql; do $P -d usci -f $f || exit 1; done
echo "base locale prête"
