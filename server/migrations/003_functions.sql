-- =====================================================================
-- 003 : fonctions serveur (programmes, attributions, invitations, export, suppression)
-- Les fonctions « security invoker » respectent la RLS de l'appelant.
-- Les fonctions « security definer » vérifient elles-mêmes le rôle et ne sont
-- exécutables que par les rôles prévus (voir les GRANT en fin de fichier).
-- =====================================================================

-- ---------- Programme : JSON de l'appli ↔ tables normalisées ----------
create or replace function public._phase_rows(p_session uuid, p_kind text) returns jsonb language sql stable security invoker set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_strip_nulls(e.extra || jsonb_build_object('n', e.name, 'sets', e.sets, 'reps', e.reps, 'rest', e.rest, 'rir', e.rir,
     'tempo', e.tempo, 'cue', e.cue, 'alt', e.alt, 'cat', e.cat, 'ss', e.superset,
     'presc', case when e.prescription = '{}'::jsonb then null else e.prescription end)) order by e.position), '[]'::jsonb)
  from session_phases ph join phase_exercises e on e.phase_id = ph.id where ph.session_id = p_session and ph.kind = p_kind $$;

create or replace function public.program_to_json(p_id uuid) returns jsonb language sql stable security invoker set search_path=public as $$
  select jsonb_strip_nulls(p.extra || jsonb_build_object(
    'id', coalesce(p.extra->>'json_id', p.ref), 'name', p.name, 'description', p.description, 'goal', p.goal, 'sport', p.sport,
    'level', p.level, 'status', p.status, 'version', p.version, 'rules', p.rules, 'engine', p.engine,
    'createdAt', p.created_at, 'updatedAt', p.updated_at, 'serverId', p.id,
    'blocks', coalesce((select jsonb_agg(jsonb_build_object('id', b.ref, 'name', b.name, 'goal', b.goal,
       'weeks', coalesce((select jsonb_agg(jsonb_build_object('id', w.ref, 'label', w.label, 'note', w.note,
          'sessions', coalesce((select jsonb_agg(s.extra || jsonb_build_object('id', s.ref, 'day', s.day, 'time', s.time_label, 'name', s.name,
               'short', s.short, 'goal', s.goal, 'dur', s.planned_min, 'int', s.intensity, 'rpe', s.rpe, 'fam', s.fam, 'optional', s.optional,
               'wuMin', (select minutes from session_phases where session_id = s.id and kind='warmup'),
               'cdMin', (select minutes from session_phases where session_id = s.id and kind='cooldown'),
               'wu',   public._phase_rows(s.id, 'warmup'),
               'main', public._phase_rows(s.id, 'main'),
               'cd',   public._phase_rows(s.id, 'cooldown')) order by s.position)
             from program_sessions s where s.week_id = w.id), '[]'::jsonb)) order by w.position)
          from program_weeks w where w.block_id = b.id), '[]'::jsonb)) order by b.position)
       from program_blocks b where b.program_id = p.id), '[]'::jsonb)))
  from programs p where p.id = p_id $$;

-- Valeur texte d'un champ JSON (nombre ou texte)
create or replace function public._t(j jsonb, k text) returns text language sql immutable set search_path=public as $$
  select case when j ? k and jsonb_typeof(j->k) <> 'null' then j->>k end $$;

-- Enregistre (crée ou remplace) un programme du coach connecté. Renvoie l'identifiant serveur.
create or replace function public.save_program(p jsonb, p_kind text default 'template', p_client uuid default null, p_ref text default null)
returns uuid language plpgsql security invoker set search_path=public as $$
declare v_id uuid; v_ref text := coalesce(p_ref, p->>'id'); v_b uuid; v_w uuid; v_s uuid; v_ph uuid;
  b jsonb; w jsonb; s jsonb; e jsonb; bi int; wi int; si int; ei int; k text; v_ver int;
  known_p text[] := array['id','name','description','goal','sport','level','status','version','rules','engine','createdAt','updatedAt','createdBy','blocks','serverId'];
  known_s text[] := array['id','day','time','name','short','goal','dur','int','rpe','fam','optional','wu','wuMin','cd','cdMin','main'];
  known_e text[] := array['n','sets','reps','rest','rir','tempo','cue','alt','cat','ss','presc'];
begin
  if not public.is_coach() then raise exception 'coach_only' using errcode='42501'; end if;
  if v_ref is null or coalesce(p->>'name','') = '' then raise exception 'program_invalid'; end if;
  if p_kind = 'client_copy' and not public.coaches(p_client) then raise exception 'not_your_client' using errcode='42501'; end if;
  v_ver := coalesce((p->>'version')::int, 1);
  select id into v_id from programs where coach_id = auth.uid() and ref = v_ref;
  if v_id is null then
    insert into programs(coach_id, kind, client_id, ref, name) values (auth.uid(), p_kind, p_client, v_ref, p->>'name') returning id into v_id;
  else
    delete from program_blocks where program_id = v_id;
  end if;
  update programs set name = p->>'name', description = coalesce(p->>'description',''), goal = coalesce(p->>'goal',''),
    sport = coalesce(p->>'sport',''), level = coalesce(p->>'level','intermediaire'), status = coalesce(p->>'status','draft'),
    version = v_ver, rules = coalesce(p->'rules','{}'::jsonb), engine = p->>'engine',
    extra = (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(p) where key <> all(known_p))
            || case when p_ref is not null then jsonb_build_object('json_id', p->>'id') else '{}'::jsonb end
  where id = v_id;
  bi := 0;
  for b in select * from jsonb_array_elements(coalesce(p->'blocks','[]'::jsonb)) loop
    insert into program_blocks(program_id, position, ref, name, goal) values (v_id, bi, b->>'id', coalesce(b->>'name',''), coalesce(b->>'goal','')) returning id into v_b;
    bi := bi + 1; wi := 0;
    for w in select * from jsonb_array_elements(coalesce(b->'weeks','[]'::jsonb)) loop
      insert into program_weeks(program_id, block_id, position, ref, label, note) values (v_id, v_b, wi, w->>'id', coalesce(w->>'label',''), coalesce(w->>'note','')) returning id into v_w;
      wi := wi + 1; si := 0;
      for s in select * from jsonb_array_elements(coalesce(w->'sessions','[]'::jsonb)) loop
        insert into program_sessions(program_id, week_id, position, ref, day, time_label, name, short, goal, planned_min, intensity, rpe, fam, optional, extra)
        values (v_id, v_w, si, s->>'id', coalesce((s->>'day')::int,0), coalesce(s->>'time',''), coalesce(s->>'name',''), coalesce(s->>'short',''),
          coalesce(s->>'goal',''), nullif(s->>'dur','')::numeric::int, coalesce(s->>'int',''), nullif(s->>'rpe','')::numeric, coalesce(s->>'fam','heavy'),
          coalesce((s->>'optional')::boolean,false),
          (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(s) where key <> all(known_s)))
        returning id into v_s;
        si := si + 1;
        foreach k in array array['warmup','main','cooldown'] loop
          insert into session_phases(program_id, session_id, kind, minutes)
          values (v_id, v_s, k, case k when 'warmup' then nullif(s->>'wuMin','')::numeric::int when 'cooldown' then nullif(s->>'cdMin','')::numeric::int end)
          returning id into v_ph;
          ei := 0;
          for e in select * from jsonb_array_elements(coalesce(s->(case k when 'warmup' then 'wu' when 'main' then 'main' else 'cd' end),'[]'::jsonb)) loop
            insert into phase_exercises(program_id, phase_id, position, name, sets, reps, rest, rir, tempo, cue, alt, cat, superset, prescription, extra)
            values (v_id, v_ph, ei, coalesce(e->>'n',''), public._t(e,'sets'), public._t(e,'reps'), public._t(e,'rest'), public._t(e,'rir'), public._t(e,'tempo'),
              public._t(e,'cue'), public._t(e,'alt'), public._t(e,'cat'), public._t(e,'ss'), coalesce(e->'presc','{}'::jsonb),
              (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(e) where key <> all(known_e)));
            ei := ei + 1;
          end loop;
        end loop;
      end loop;
    end loop;
  end loop;
  insert into audit_log(actor_id, coach_id, client_id, action, detail)
  values (auth.uid(), auth.uid(), p_client, case when p_kind='template' then 'program_saved' else 'client_program_saved' end,
          jsonb_build_object('program', p->>'name', 'version', v_ver));
  return v_id;
end $$;

-- Attribution (création ou mise à jour) : la copie du client est indépendante du modèle
create or replace function public.save_assignment(a jsonb) returns uuid language plpgsql security invoker set search_path=public as $$
declare v_client uuid := (a->>'clientSid')::uuid; v_tpl uuid; v_copy uuid; v_id uuid; v_ref text := a->>'id';
begin
  if not public.is_coach() or not public.coaches(v_client) then raise exception 'not_your_client' using errcode='42501'; end if;
  select id into v_tpl from programs where coach_id = auth.uid() and ref = a->>'programId' and kind = 'template';
  v_copy := public.save_program(a->'prog', 'client_copy', v_client, 'asg:' || v_ref);
  if coalesce(a->>'status','active') = 'active' then
    update assignments set status = 'ended', end_date = least(coalesce(end_date, (a->>'startDate')::date - 1), (a->>'startDate')::date - 1)
    where client_id = v_client and status = 'active' and ref <> v_ref;
  end if;
  insert into assignments(ref, coach_id, client_id, program_id, copy_program_id, program_version, start_date, end_date, start_week, status, customized, history)
  values (v_ref, auth.uid(), v_client, v_tpl, v_copy, coalesce((a->>'programVersion')::int,1), (a->>'startDate')::date, nullif(a->>'endDate','')::date,
          coalesce((a->>'startWeek')::int,0), coalesce(a->>'status','active'), coalesce((a->>'customized')::boolean,false), coalesce(a->'history','[]'::jsonb))
  on conflict (client_id, ref) do update set program_id = excluded.program_id, copy_program_id = excluded.copy_program_id,
     program_version = excluded.program_version, start_date = excluded.start_date, end_date = excluded.end_date, start_week = excluded.start_week,
     status = excluded.status, customized = excluded.customized, history = excluded.history
  returning id into v_id;
  return v_id;
end $$;

-- Attributions visibles par l'appelant (client : les siennes ; coach : celles de ses clients), avec programme embarqué
create or replace function public.assignments_json() returns jsonb language sql stable security invoker set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', a.ref, 'serverId', a.id, 'clientSid', a.client_id, 'coachSid', a.coach_id,
     'programId', coalesce(t.ref, a.ref), 'programVersion', a.program_version, 'startDate', a.start_date, 'endDate', a.end_date,
     'startWeek', a.start_week, 'status', a.status, 'customized', a.customized, 'history', a.history, 'assignedAt', a.created_at,
     'prog', public.program_to_json(a.copy_program_id)) order by a.created_at), '[]'::jsonb)
  from assignments a left join programs t on t.id = a.program_id $$;

-- Invitations du coach (sans l'empreinte du code)
create or replace function public.coach_invites() returns setof public.invites language sql stable security definer set search_path=public as $$
  select * from invites where coach_id = auth.uid() and public.is_coach() $$;

-- Tout ce dont l'espace coach a besoin, en un appel (RLS appliquée)
create or replace function public.coach_snapshot() returns jsonb language plpgsql stable security invoker set search_path=public as $$
begin
  if not public.is_coach() then raise exception 'coach_only' using errcode='42501'; end if;
  return jsonb_build_object(
    'me', (select to_jsonb(p) from profiles p where id = auth.uid()),
    'clients', (select coalesce(jsonb_agg(to_jsonb(p) || jsonb_build_object('formula_key', f.key, 'link_status', cc.status, 'linked_at', cc.started_at)), '[]'::jsonb)
                from coach_clients cc join profiles p on p.id = cc.client_id left join formulas f on f.id = cc.formula_id where cc.coach_id = auth.uid()),
    'formulas', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from formulas f where coach_id = auth.uid()),
    'programs', (select coalesce(jsonb_agg(public.program_to_json(id)), '[]'::jsonb) from programs where coach_id = auth.uid() and kind = 'template'),
    'assignments', public.assignments_json(),
    'invites', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'hint', code_hint, 'email', email, 'draft', draft, 'programId', program_id,
                 'startDate', start_date, 'startWeek', start_week, 'expiresAt', expires_at, 'usedAt', used_at, 'usedBy', used_by, 'revokedAt', revoked_at,
                 'createdAt', created_at, 'formula', (select key from formulas where id = i.formula_id)) order by created_at desc), '[]'::jsonb)
                from public.coach_invites() i),
    'calls', (select coalesce(jsonb_agg(to_jsonb(c) order by created_at desc), '[]'::jsonb) from call_requests c where coach_id = auth.uid()),
    'audit', (select coalesce(jsonb_agg(to_jsonb(l) order by at desc), '[]'::jsonb) from (select * from audit_log where coach_id = auth.uid() order by at desc limit 300) l),
    'testTypes', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from test_types t where coach_id = auth.uid() or coach_id is null));
end $$;

-- Toutes les données d'un athlète (lui-même ou son coach) : RLS appliquée
create or replace function public.athlete_snapshot(p_athlete uuid default null) returns jsonb language sql stable security invoker set search_path=public as $$
  with a as (select coalesce(p_athlete, auth.uid()) id)
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p, a where p.id = a.id),
    'tests', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from test_results t, a where t.athlete_id = a.id),
    'logs', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from session_logs t, a where t.athlete_id = a.id),
    'wellness', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from wellness_entries t, a where t.athlete_id = a.id),
    'pain', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from pain_reports t, a where t.athlete_id = a.id),
    'other', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from other_activities t, a where t.athlete_id = a.id),
    'club', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from club_events t, a where t.athlete_id = a.id),
    'hr', (select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from hr_records t, a where t.athlete_id = a.id),
    'state', (select doc from athlete_state t, a where t.athlete_id = a.id),
    'formula', (select jsonb_build_object('key', f.key, 'name', f.name, 'entitlements', f.entitlements)
                from coach_clients cc join formulas f on f.id = cc.formula_id, a where cc.client_id = a.id and cc.status = 'active'),
    'coach', (select jsonb_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name)
              from coach_clients cc join profiles p on p.id = cc.coach_id, a where cc.client_id = a.id and cc.status = 'active')) $$;

-- Droits effectifs de l'utilisateur connecté (calculés par le serveur, jamais lus dans le stockage local)
create or replace function public.my_entitlements() returns text[] language sql stable security definer set search_path=public as $$
  select case when public.is_coach() then array['predefined_programs','individual_program','custom_tests','auto_loads','auto_adapt',
    'private_messaging','group_messaging','weekly_follow','coach_review','calls','advanced_stats','extended_history']
  else coalesce((select f.entitlements from coach_clients cc join formulas f on f.id = cc.formula_id
                 where cc.client_id = auth.uid() and cc.status = 'active' and f.enabled), '{}') end $$;

-- Rattache le programme historique de Lucas à SON profil (coach qui s'entraîne lui-même uniquement)
create or replace function public.claim_legacy_ctx(p_ctx text) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_ctx <> 'lucas-2026' or not public.is_coach() then raise exception 'forbidden' using errcode='42501'; end if;
  update profiles set legacy_ctx = p_ctx where id = auth.uid();
  insert into coach_clients(coach_id, client_id, formula_id)
    select auth.uid(), auth.uid(), (select id from formulas where coach_id = auth.uid() and key = 'coaching')
    on conflict do nothing;
  insert into audit_log(actor_id, coach_id, client_id, action, detail) values (auth.uid(), auth.uid(), auth.uid(), 'legacy_ctx_claimed', jsonb_build_object('ctx', p_ctx));
end $$;

-- ---------- Invitations ----------
create or replace function public._norm_code(c text) returns text language sql immutable set search_path=public as $$
  select upper(regexp_replace(coalesce(c,''), '[^A-Za-z0-9]', '', 'g')) $$;
create or replace function public._hash_code(c text) returns bytea language sql immutable set search_path=public as $$
  select extensions.digest(public._norm_code(c), 'sha256') $$;

-- Génération côté serveur : renvoie le code en clair UNE seule fois (seule l'empreinte est conservée)
create or replace function public.create_invite(p jsonb) returns jsonb language plpgsql volatile security definer set search_path=public, extensions as $$
declare v_code text := ''; v_alpha text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; v_bytes bytea; i int; v_prog uuid; v_form uuid; v_id uuid; v_days int;
begin
  if not public.is_coach() then raise exception 'coach_only' using errcode='42501'; end if;
  if (select count(*) from invites where coach_id = auth.uid() and created_at > now() - interval '1 day') >= 50 then raise exception 'invite_quota'; end if;
  if p->>'programRef' is not null then
    select id into v_prog from programs where coach_id = auth.uid() and ref = p->>'programRef' and kind = 'template';
    if v_prog is null then raise exception 'program_not_found'; end if;
  end if;
  select id into v_form from formulas where coach_id = auth.uid() and key = coalesce(p->>'formula','perso');
  v_days := least(greatest(coalesce((p->>'days')::int, 14), 1), 60);
  loop
    v_bytes := gen_random_bytes(8); v_code := '';
    for i in 0..7 loop v_code := v_code || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1); end loop;
    exit when not exists(select 1 from invites where code_hash = public._hash_code(v_code));
  end loop;
  insert into invites(coach_id, code_hash, code_hint, email, draft, formula_id, program_id, start_date, start_week, expires_at)
  values (auth.uid(), public._hash_code(v_code), right(v_code, 2), nullif(p->>'email',''), coalesce(p->'draft','{}'::jsonb), v_form, v_prog,
          nullif(p->>'startDate','')::date, coalesce((p->>'startWeek')::int,0), now() + make_interval(days => v_days))
  returning id into v_id;
  insert into audit_log(actor_id, coach_id, action, detail) values (auth.uid(), auth.uid(), 'invite_created',
    jsonb_build_object('invite', v_id, 'first', p->'draft'->>'first'));
  return jsonb_build_object('id', v_id, 'code', substr(v_code,1,4) || '-' || substr(v_code,5,4), 'expiresAt', now() + make_interval(days => v_days));
end $$;

create or replace function public.revoke_invite(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  update invites set revoked_at = now() where id = p_id and coach_id = auth.uid() and used_at is null and public.is_coach();
  if not found then raise exception 'invite_not_found'; end if;
  insert into audit_log(actor_id, coach_id, action, detail) values (auth.uid(), auth.uid(), 'invite_revoked', jsonb_build_object('invite', p_id));
end $$;

-- Limitation des essais : 5 échecs par empreinte réseau et par tranche de 15 minutes
create or replace function public._invite_locked(p_ip text) returns boolean language sql stable security definer set search_path=public as $$
  select count(*) >= 5 from invite_attempts where ip_hash = p_ip and not ok and at > now() - interval '15 minutes' $$;

-- Aperçu (serveur uniquement, appelé par la fonction « invite ») : ne consomme pas le code
create or replace function public.invite_preview(p_code text, p_ip text) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare r record;
begin
  if public._invite_locked(p_ip) then return jsonb_build_object('ok', false, 'error', 'locked'); end if;
  select i.*, (select name from programs where id = i.program_id) prog_name, (select name from formulas where id = i.formula_id) formula_name,
         (select first_name || ' ' || last_name from profiles where id = i.coach_id) coach_name
    into r from invites i where code_hash = public._hash_code(p_code) and used_at is null and revoked_at is null and expires_at > now();
  if r.id is null then
    insert into invite_attempts(ip_hash, ok) values (p_ip, false);
    insert into security_log(event, ip_hash) values ('invite_invalid', p_ip);
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  insert into invite_attempts(ip_hash, ok) values (p_ip, true);
  return jsonb_build_object('ok', true, 'email', r.email, 'draft', r.draft, 'program', r.prog_name, 'startDate', r.start_date,
    'startWeek', r.start_week, 'formula', r.formula_name, 'coach', r.coach_name, 'expiresAt', r.expires_at);
end $$;

-- Utilisation (serveur uniquement) : verrou sur la ligne → usage unique garanti même en cas de double envoi
create or replace function public.invite_redeem(p_code text, p_ip text, p_user uuid, p_patch jsonb) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare r invites%rowtype; v_copy uuid; v_tpl jsonb; v_aref text; v_end date; v_weeks int; v_patch jsonb;
begin
  if public._invite_locked(p_ip) then return jsonb_build_object('ok', false, 'error', 'locked'); end if;
  select * into r from invites where code_hash = public._hash_code(p_code) and used_at is null and revoked_at is null and expires_at > now() for update;
  if r.id is null then
    insert into invite_attempts(ip_hash, ok) values (p_ip, false);
    insert into security_log(event, ip_hash) values ('invite_invalid', p_ip);
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  -- Champs que l'athlète peut corriger (jamais rôle, coach, formule ou programme)
  v_patch := coalesce(p_patch, '{}'::jsonb);
  update profiles set
    first_name = coalesce(nullif(v_patch->>'first',''), r.draft->>'first', first_name),
    last_name  = coalesce(nullif(v_patch->>'last',''), r.draft->>'last', last_name),
    sex        = coalesce(nullif(v_patch->>'sex',''), r.draft->>'sex', sex),
    birth_year = coalesce(nullif(v_patch->>'birthYear','')::int, nullif(r.draft->>'birthYear','')::int, birth_year),
    height_cm  = coalesce(nullif(v_patch->>'height','')::numeric, nullif(r.draft->>'height','')::numeric, height_cm),
    weight_kg  = coalesce(nullif(v_patch->>'weight','')::numeric, nullif(r.draft->>'weight','')::numeric, weight_kg),
    questionnaire = questionnaire || coalesce(r.draft->'questionnaire','{}'::jsonb) || coalesce(v_patch->'questionnaire','{}'::jsonb)
                    || jsonb_build_object('sport', coalesce(v_patch->>'sport', r.draft->>'sport'), 'goal', coalesce(v_patch->>'goal', r.draft->>'goal'),
                                          'source', 'invitation', 'email_verified_by', 'code_invitation')
  where id = p_user;
  insert into coach_clients(coach_id, client_id, formula_id) values (r.coach_id, p_user, r.formula_id);
  if r.program_id is not null then
    -- copie personnelle du modèle (le modèle n'est jamais modifié)
    perform set_config('request.jwt.claims', jsonb_build_object('sub', r.coach_id, 'role', 'authenticated')::text, true);
    v_tpl := public.program_to_json(r.program_id);
    v_aref := 'asg-' || substr(md5(r.id::text), 1, 12);
    select count(*) into v_weeks from program_weeks where program_id = r.program_id;
    v_weeks := greatest(v_weeks - r.start_week, 1);
    v_end := (coalesce(r.start_date, current_date) - ((extract(isodow from coalesce(r.start_date, current_date))::int) - 1)) + v_weeks * 7 - 1;
    perform public.save_assignment(jsonb_build_object('id', v_aref, 'clientSid', p_user, 'programId', v_tpl->>'id', 'programVersion', v_tpl->'version',
      'startDate', coalesce(r.start_date, current_date), 'endDate', v_end, 'startWeek', r.start_week, 'status', 'active', 'customized', false,
      'history', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'invitation', 'what', 'Programme « ' || (v_tpl->>'name') || ' » attribué par invitation')),
      'prog', v_tpl));
    perform set_config('request.jwt.claims', '', true);
  end if;
  update invites set used_at = now(), used_by = p_user where id = r.id;
  insert into invite_attempts(ip_hash, ok) values (p_ip, true);
  insert into audit_log(coach_id, client_id, action, detail) values (r.coach_id, p_user, 'invite_used', jsonb_build_object('invite', r.id));
  insert into security_log(user_id, event, ip_hash) values (p_user, 'invite_used', p_ip);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Données personnelles ----------
create or replace function public.export_my_data() returns jsonb language sql stable security invoker set search_path=public as $$
  select public.athlete_snapshot(auth.uid()) || jsonb_build_object(
    'exported_at', now(),
    'assignments', public.assignments_json(),
    'messages', (select coalesce(jsonb_agg(to_jsonb(m) order by created_at), '[]'::jsonb) from messages m where sender_id = auth.uid() or client_id = auth.uid()),
    'call_requests', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from call_requests c where client_id = auth.uid()),
    'consents', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from consents c where user_id = auth.uid()),
    'history', (select coalesce(jsonb_agg(to_jsonb(l)), '[]'::jsonb) from audit_log l where client_id = auth.uid())) $$;

-- Purge (serveur uniquement, appelée par la fonction « delete-account » avant suppression du compte Auth)
create or replace function public.purge_user(p_user uuid) returns jsonb language plpgsql volatile security definer set search_path=public as $$
declare n_msg int; n_log int;
begin
  if exists(select 1 from coach_clients where coach_id = p_user and client_id <> p_user and status = 'active') then
    return jsonb_build_object('ok', false, 'error', 'coach_has_clients');
  end if;
  update messages set sender_id = null, body = 'Message d''un ancien membre (supprimé)', media_path = null
   where sender_id = p_user and client_id is null;           -- groupe : anonymisé
  get diagnostics n_msg = row_count;
  update audit_log set detail = '{}'::jsonb, actor_id = case when actor_id = p_user then null else actor_id end,
         client_id = case when client_id = p_user then null else client_id end
   where client_id = p_user or actor_id = p_user;            -- historique restant anonymisé
  get diagnostics n_log = row_count;
  update security_log set user_id = null, detail = '{}'::jsonb where user_id = p_user;
  update invites set used_by = null, draft = '{}'::jsonb, email = null where used_by = p_user;
  insert into security_log(event, detail) values ('account_deleted', jsonb_build_object('group_messages_anonymized', n_msg, 'history_anonymized', n_log));
  return jsonb_build_object('ok', true, 'group_messages_anonymized', n_msg, 'history_anonymized', n_log);
  -- les autres tables sont supprimées par cascade lors de la suppression du compte Auth
end $$;

-- ---------- Droits d'exécution ----------
revoke execute on all functions in schema public from public, anon;
-- Supabase accorde EXECUTE à « authenticated » par défaut : les fonctions réservées au serveur sont retirées explicitement
revoke execute on function public.invite_preview(text,text), public.invite_redeem(text,text,uuid,jsonb), public.purge_user(uuid),
  public._invite_locked(text), public.ensure_default_formulas(uuid), public.handle_new_user() from authenticated;
grant execute on function public.is_coach(), public.coaches(uuid), public.my_coach(), public.has_entitlement(text), public.can_read_program(uuid),
  public.owns_program(uuid), public.program_to_json(uuid), public._phase_rows(uuid,text), public._t(jsonb,text), public.save_program(jsonb,text,uuid,text),
  public.save_assignment(jsonb), public.assignments_json(), public.coach_snapshot(), public.coach_invites(), public.athlete_snapshot(uuid),
  public.my_entitlements(), public.claim_legacy_ctx(text), public.create_invite(jsonb), public.revoke_invite(uuid), public.export_my_data(),
  public._norm_code(text), public._hash_code(text)
  to authenticated;
grant execute on function public.invite_preview(text,text), public.invite_redeem(text,text,uuid,jsonb), public.purge_user(uuid),
  public.program_to_json(uuid), public._phase_rows(uuid,text), public.save_program(jsonb,text,uuid,text), public.save_assignment(jsonb),
  public.is_coach(), public.coaches(uuid), public._norm_code(text), public._hash_code(text), public._invite_locked(text), public.owns_program(uuid), public.can_read_program(uuid), public._t(jsonb,text)
  to service_role;
