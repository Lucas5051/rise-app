-- =====================================================================
-- 006 : corrections du coach dans les données de ses clients + journal du coach synchronisé
-- =====================================================================
create policy sl_coach_insert on public.session_logs for insert to authenticated with check (public.is_coach() and public.coaches(athlete_id));
create policy st_coach_insert on public.athlete_state for insert to authenticated with check (public.is_coach() and public.coaches(athlete_id));
create policy st_coach_update on public.athlete_state for update to authenticated using (public.is_coach() and public.coaches(athlete_id)) with check (public.coaches(athlete_id));
alter table public.audit_log add column if not exists ref text;
create unique index if not exists audit_log_actor_ref on public.audit_log(actor_id, ref);
