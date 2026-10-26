-- =====================================================================
-- 009 : performances du chargement des programmes (constaté le 24/10 : 7 s pour 12 programmes, au-delà
-- du délai de 8 s de l'API → échec de la synchronisation du coach).
-- Causes : colonnes de liaison non indexées (balayage complet) et règle RLS évaluée sur CHAQUE ligne lue.
-- Correctifs :
--  1. index sur toutes les colonnes de liaison ;
--  2. program_to_json vérifie UNE fois le droit de lecture (can_read_program) puis lit sans RLS ligne à ligne ;
--     sans droit, la fonction renvoie NULL (aucune fuite) ;
--  3. _phase_rows devient interne : plus appelable par les utilisateurs.
-- =====================================================================
create index if not exists program_weeks_block_id_idx     on public.program_weeks(block_id);
create index if not exists program_sessions_week_id_idx   on public.program_sessions(week_id);
create index if not exists session_phases_session_id_idx  on public.session_phases(session_id, kind);
create index if not exists phase_exercises_phase_id_idx   on public.phase_exercises(phase_id, position);
create index if not exists programs_client_kind_idx       on public.programs(client_id, kind);
create index if not exists programs_coach_kind_idx        on public.programs(coach_id, kind);

create or replace function public._phase_rows(p_session uuid, p_kind text) returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_strip_nulls(e.extra || jsonb_build_object('n', e.name, 'sets', e.sets, 'reps', e.reps, 'rest', e.rest, 'rir', e.rir,
     'tempo', e.tempo, 'cue', e.cue, 'alt', e.alt, 'cat', e.cat, 'ss', e.superset,
     'presc', case when e.prescription = '{}'::jsonb then null else e.prescription end)) order by e.position), '[]'::jsonb)
  from session_phases ph join phase_exercises e on e.phase_id = ph.id where ph.session_id = p_session and ph.kind = p_kind $$;

create or replace function public.program_to_json(p_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
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
  from programs p where p.id = p_id and public.can_read_program(p_id) $$;

revoke execute on function public._phase_rows(uuid, text) from public, anon, authenticated;
revoke execute on function public.program_to_json(uuid) from public, anon;
grant execute on function public.program_to_json(uuid) to authenticated;
