-- =====================================================================
-- 002 : rôles, isolation des données (Row Level Security), droits des formules
-- Principe : tout est refusé par défaut ; chaque table n'ouvre que ce qui est nécessaire.
-- =====================================================================

-- ---------- Fonctions d'aide (security definer : lisent les tables sans RLS, ne renvoient qu'un booléen) ----------
create or replace function public.is_coach() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'coach') $$;

create or replace function public.coaches(p_client uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from coach_clients where coach_id = auth.uid() and client_id = p_client) $$;

create or replace function public.my_coach() returns uuid language sql stable security definer set search_path=public as $$
  select coach_id from coach_clients where client_id = auth.uid() and status = 'active' limit 1 $$;

-- Droit lié à la formule du client connecté (un coach a tous les droits sur son espace)
create or replace function public.has_entitlement(p_key text) returns boolean language sql stable security definer set search_path=public as $$
  select public.is_coach() or exists(
    select 1 from coach_clients cc join formulas f on f.id = cc.formula_id
    where cc.client_id = auth.uid() and cc.status = 'active' and f.enabled and p_key = any(f.entitlements)) $$;

create or replace function public.can_read_program(p_program uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from programs p where p.id = p_program and (
      p.coach_id = auth.uid()
      or (p.kind = 'client_copy' and p.client_id = auth.uid()))) $$;

create or replace function public.owns_program(p_program uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from programs where id = p_program and coach_id = auth.uid()) and public.is_coach() $$;

-- ---------- Création du profil à l'inscription : rôle toujours « athlete » sauf liste blanche coach ----------
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare v_role text := 'athlete';
begin
  if exists(select 1 from coach_allowlist where lower(email) = lower(new.email)) then v_role := 'coach'; end if;
  insert into profiles(id, role, email, first_name, last_name)
  values (new.id, v_role, new.email,
          coalesce(new.raw_user_meta_data->>'first_name',''), coalesce(new.raw_user_meta_data->>'last_name',''))
  on conflict (id) do nothing;
  if v_role = 'coach' then perform public.ensure_default_formulas(new.id); end if;
  insert into security_log(user_id, event, detail) values (new.id, 'account_created', jsonb_build_object('role', v_role));
  return new;
end $$;

-- Formules par défaut d'un coach (droits modifiables ensuite par le coach)
create or replace function public.ensure_default_formulas(p_coach uuid) returns void language sql security definer set search_path=public as $$
  insert into formulas(coach_id, key, name, recommended, entitlements) values
   (p_coach,'programmes','Programmes',false, array['predefined_programs']),
   (p_coach,'perso','Programme personnalisé',true, array['predefined_programs','individual_program','custom_tests','auto_loads','auto_adapt','weekly_follow']),
   (p_coach,'coaching','Coaching',false, array['predefined_programs','individual_program','custom_tests','auto_loads','auto_adapt','weekly_follow',
      'private_messaging','group_messaging','coach_review','calls','advanced_stats','extended_history'])
  on conflict (coach_id, key) do nothing $$;

-- Rôle : jamais modifiable par un client (ni par l'API, ni en changeant une valeur locale)
create or replace function public.protect_profile() returns trigger language plpgsql set search_path='' as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(),'') <> 'service_role' and current_user not in ('postgres','supabase_admin') then
    raise exception 'role_change_forbidden' using errcode = '42501';
  end if;
  if new.legacy_ctx is distinct from old.legacy_ctx and coalesce(auth.role(),'') <> 'service_role' and current_user not in ('postgres','supabase_admin') then
    raise exception 'legacy_ctx_forbidden' using errcode = '42501';
  end if;
  new.id := old.id; new.email := old.email;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile();

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Conflits : la modification la plus récente (horodatage client) l'emporte, sans doublon ----------
create or replace function public.keep_newest() returns trigger language plpgsql set search_path='' as $$
begin
  if new.client_updated_at < old.client_updated_at then return old; end if;  -- version plus ancienne ignorée
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['session_logs','wellness_entries','other_activities','club_events','hr_records','athlete_state'] loop
    execute format('create trigger %I_newest before update on public.%I for each row execute function public.keep_newest()', t, t);
  end loop; end $$;

-- ---------- Activation RLS partout ----------
do $$ declare t text; begin
  foreach t in array array['profiles','coach_allowlist','formulas','coach_clients','invites','invite_attempts','programs','program_blocks',
    'program_weeks','program_sessions','session_phases','phase_exercises','assignments','exercises','exercise_media','test_types',
    'test_results','session_logs','wellness_entries','pain_reports','other_activities','club_events','hr_records','athlete_state',
    'messages','call_requests','coach_reviews','consents','audit_log','security_log'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop; end $$;
-- coach_allowlist, invites, invite_attempts, security_log : aucune politique client (accès serveur uniquement)

-- ---------- Profils ----------
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.coaches(id));
create policy profiles_coach_of_me on public.profiles for select to authenticated using (id = public.my_coach());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update (role, legacy_ctx, id, email) on public.profiles from authenticated, anon;

-- ---------- Formules ----------
create policy formulas_coach on public.formulas for all to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());
create policy formulas_client_read on public.formulas for select to authenticated using (coach_id = public.my_coach());

-- ---------- Relation coach ↔ client ----------
create policy cc_read on public.coach_clients for select to authenticated using (coach_id = auth.uid() or client_id = auth.uid());
create policy cc_coach_update on public.coach_clients for update to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid());
-- création uniquement par le serveur (invitation) ; un client ne peut jamais se rattacher seul

-- ---------- Programmes : écriture réservée au coach propriétaire ; lecture de SA copie par le client ----------
create policy programs_read on public.programs for select to authenticated using (public.can_read_program(id));
create policy programs_write on public.programs for all to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());
do $$ declare t text; begin
  foreach t in array array['program_blocks','program_weeks','program_sessions','session_phases','phase_exercises'] loop
    execute format('create policy %I_read on public.%I for select to authenticated using (public.can_read_program(program_id))', t, t);
    execute format('create policy %I_write on public.%I for all to authenticated using (public.owns_program(program_id)) with check (public.owns_program(program_id))', t, t);
  end loop; end $$;

create policy asg_read on public.assignments for select to authenticated using (client_id = auth.uid() or coach_id = auth.uid());
create policy asg_coach_write on public.assignments for all to authenticated using (coach_id = auth.uid() and public.is_coach() and public.coaches(client_id))
  with check (coach_id = auth.uid() and public.is_coach() and public.coaches(client_id));

-- ---------- Bibliothèque ----------
create policy ex_coach on public.exercises for all to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());
create policy ex_client_read on public.exercises for select to authenticated using (coach_id = public.my_coach() and status = 'published');
create policy exm_coach on public.exercise_media for all to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());
create policy exm_client_read on public.exercise_media for select to authenticated using (coach_id = public.my_coach() and status = 'published');

-- ---------- Tests ----------
create policy tt_read on public.test_types for select to authenticated using (coach_id is null or coach_id = auth.uid() or coach_id = public.my_coach());
create policy tt_coach on public.test_types for all to authenticated using (coach_id = auth.uid() and public.is_coach()) with check (coach_id = auth.uid() and public.is_coach());

-- ---------- Données de l'athlète : lui-même (lecture/écriture), son coach (lecture + écriture tests/journal) ----------
do $$ declare t text; begin
  foreach t in array array['test_results','session_logs','wellness_entries','pain_reports','other_activities','club_events','hr_records','athlete_state'] loop
    execute format('create policy %I_self on public.%I for all to authenticated using (athlete_id = auth.uid()) with check (athlete_id = auth.uid())', t, t);
    execute format('create policy %I_coach_read on public.%I for select to authenticated using (public.coaches(athlete_id))', t, t);
  end loop; end $$;
create policy tr_coach_write on public.test_results for insert to authenticated with check (public.is_coach() and public.coaches(athlete_id));
create policy tr_coach_update on public.test_results for update to authenticated using (public.is_coach() and public.coaches(athlete_id)) with check (public.coaches(athlete_id));
create policy sl_coach_update on public.session_logs for update to authenticated using (public.is_coach() and public.coaches(athlete_id)) with check (public.coaches(athlete_id));

-- ---------- Messagerie : soumise aux droits de la formule ----------
create policy msg_read on public.messages for select to authenticated using (
  coach_id = auth.uid()
  or (client_id = auth.uid() and public.has_entitlement('private_messaging'))
  or (client_id is null and coach_id = public.my_coach() and public.has_entitlement('group_messaging')));
create policy msg_send on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (
    (coach_id = auth.uid() and public.is_coach() and (client_id is null or public.coaches(client_id)))
    or (coach_id = public.my_coach() and client_id = auth.uid() and public.has_entitlement('private_messaging'))
    or (coach_id = public.my_coach() and client_id is null and public.has_entitlement('group_messaging'))));
create policy msg_mark_read on public.messages for update to authenticated using (coach_id = auth.uid() or client_id = auth.uid()) with check (coach_id = auth.uid() or client_id = auth.uid());
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;

create policy call_client on public.call_requests for insert to authenticated with check (client_id = auth.uid() and coach_id = public.my_coach() and public.has_entitlement('calls'));
create policy call_read on public.call_requests for select to authenticated using (client_id = auth.uid() or coach_id = auth.uid());
create policy call_coach_update on public.call_requests for update to authenticated using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create policy review_coach on public.coach_reviews for all to authenticated using (coach_id = auth.uid() and public.coaches(client_id)) with check (coach_id = auth.uid() and public.coaches(client_id));
create policy review_client on public.coach_reviews for select to authenticated using (client_id = auth.uid() and (
  (kind = 'weekly' and public.has_entitlement('weekly_follow')) or (kind = 'bilan' and public.has_entitlement('coach_review'))));

-- ---------- Consentements, historique ----------
create policy consent_self on public.consents for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy audit_read on public.audit_log for select to authenticated using (coach_id = auth.uid() or client_id = auth.uid());
create policy audit_coach_insert on public.audit_log for insert to authenticated with check (actor_id = auth.uid() and (coach_id = auth.uid() or client_id = auth.uid()));

-- Aucun accès anonyme direct aux tables
revoke all on all tables in schema public from anon;
