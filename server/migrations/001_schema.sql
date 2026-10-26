-- =====================================================================
-- USCI Muscu · schéma de production (Supabase / PostgreSQL 15+)
-- 001 : tables, contraintes, index. Les règles d'accès (RLS) sont en 002,
-- les fonctions serveur (programmes, invitations, export…) en 003.
-- Aucune donnée personnelle n'est insérée par ce fichier.
-- =====================================================================
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;


-- ---------- Comptes et rôles ----------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'athlete' check (role in ('athlete','coach')),
  first_name  text not null default '',
  last_name   text not null default '',
  email       text,
  sex         text check (sex in ('f','m','autre','nr')),
  birth_year  int  check (birth_year between 1920 and 2025),
  height_cm   numeric check (height_cm between 100 and 250),
  weight_kg   numeric check (weight_kg between 30 and 250),
  questionnaire jsonb not null default '{}'::jsonb,   -- réponses d'inscription (objectifs, sports, dispo, matériel…)
  legacy_ctx  text,                                   -- 'lucas-2026' pour le programme historique de Lucas uniquement
  local_ref   text,                                   -- identifiant local de l'appli (migration v9)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on column public.profiles.role is 'Contrôlé par le serveur : jamais modifiable par le client.';

-- Adresses autorisées à devenir coach (rempli par l'administrateur, invisible des clients)
create table public.coach_allowlist (email text primary key, added_at timestamptz not null default now());

-- ---------- Formules et droits ----------
create table public.formulas (
  id           uuid primary key default gen_random_uuid(),
  coach_id     uuid not null references public.profiles(id) on delete cascade,
  key          text not null,
  name         text not null,
  price_label  text not null default '',
  engagement   text not null default '',
  enabled      boolean not null default true,
  recommended  boolean not null default false,
  entitlements text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (coach_id, key),
  constraint entitlements_known check (entitlements <@ array[
    'predefined_programs','individual_program','custom_tests','auto_loads','auto_adapt',
    'private_messaging','group_messaging','weekly_follow','coach_review','calls','advanced_stats','extended_history']::text[])
);

-- Relation coach ↔ client (un client a au plus un coach actif)
create table public.coach_clients (
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  client_id   uuid not null references public.profiles(id) on delete cascade,
  formula_id  uuid references public.formulas(id) on delete set null,
  status      text not null default 'active' check (status in ('active','ended')),
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  primary key (coach_id, client_id)
);
create unique index coach_clients_one_active on public.coach_clients(client_id) where status='active';

-- ---------- Invitations (code jamais stocké en clair) ----------
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  code_hash   bytea not null unique,           -- sha256(code normalisé)
  code_hint   text not null,                   -- 2 derniers caractères, pour que le coach reconnaisse le code
  email       text,
  draft       jsonb not null default '{}'::jsonb, -- identité et informations préparées par le coach
  formula_id  uuid references public.formulas(id) on delete set null,
  program_id  uuid,                             -- modèle à attribuer (FK ajoutée après programs)
  start_date  date,
  start_week  int not null default 0 check (start_week >= 0),
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references public.profiles(id) on delete set null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create table public.invite_attempts (
  id       bigint generated always as identity primary key,
  ip_hash  text not null,
  ok       boolean not null,
  at       timestamptz not null default now()
);
create index invite_attempts_ip on public.invite_attempts(ip_hash, at);

-- ---------- Programmes (normalisés) ----------
create table public.programs (
  id                uuid primary key default gen_random_uuid(),
  coach_id          uuid not null references public.profiles(id) on delete cascade,
  kind              text not null default 'template' check (kind in ('template','client_copy')),
  client_id         uuid references public.profiles(id) on delete cascade,  -- pour une copie personnalisée
  origin_program_id uuid references public.programs(id) on delete set null,
  ref               text not null,                -- identifiant utilisé par l'appli (stable entre appareils)
  name              text not null,
  description       text not null default '',
  goal              text not null default '',
  sport             text not null default '',
  level             text not null default 'intermediaire',
  status            text not null default 'draft' check (status in ('draft','active','archived')),
  version           int  not null default 1,
  rules             jsonb not null default '{}'::jsonb,   -- adaptations autorisées
  engine            text,                                 -- 'lucas-2026' : moteur historique
  extra             jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (coach_id, ref),
  constraint copy_has_client check ((kind='client_copy') = (client_id is not null))
);
alter table public.invites add constraint invites_program_fk foreign key (program_id) references public.programs(id) on delete set null;

create table public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  position int not null, ref text not null, name text not null default '', goal text not null default ''
);
create table public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  block_id uuid not null references public.program_blocks(id) on delete cascade,
  position int not null, ref text not null, label text not null default '', note text not null default ''
);
create table public.program_sessions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week_id uuid not null references public.program_weeks(id) on delete cascade,
  position int not null, ref text not null,
  day int not null default 0 check (day between 0 and 6),
  time_label text not null default '', name text not null default '', short text not null default '',
  goal text not null default '', planned_min int, intensity text not null default '', rpe numeric,
  fam text not null default 'heavy', optional boolean not null default false,
  extra jsonb not null default '{}'::jsonb
);
create table public.session_phases (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  session_id uuid not null references public.program_sessions(id) on delete cascade,
  kind text not null check (kind in ('warmup','main','cooldown')),
  minutes int
);
create table public.phase_exercises (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  phase_id uuid not null references public.session_phases(id) on delete cascade,
  position int not null,
  name text not null,
  sets text, reps text, rest text, rir text, tempo text, cue text, alt text, cat text, superset text,
  prescription jsonb not null default '{}'::jsonb,   -- mode de charge structuré (voir docs/ARCHITECTURE.md)
  extra jsonb not null default '{}'::jsonb
);
create index on public.program_blocks(program_id);
create index on public.program_weeks(program_id);
create index on public.program_sessions(program_id);
create index on public.session_phases(program_id);
create index on public.phase_exercises(program_id);

-- Attribution : pointe vers le modèle et vers la copie personnelle du client
create table public.assignments (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null,
  coach_id        uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid not null references public.profiles(id) on delete cascade,
  program_id      uuid references public.programs(id) on delete set null,
  copy_program_id uuid not null references public.programs(id) on delete cascade,
  program_version int not null default 1,
  start_date      date not null,
  end_date        date,
  start_week      int not null default 0,
  status          text not null default 'active' check (status in ('active','ended','paused')),
  customized      boolean not null default false,
  history         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id, ref)
);
create unique index assignments_one_active on public.assignments(client_id) where status='active';

-- ---------- Bibliothèque d'exercices et médias ----------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, category text not null default '',
  cues text[] not null default '{}', errors text[] not null default '{}', muscles text[] not null default '{}',
  equipment text not null default '', alternative text not null default '',
  status text not null default 'draft' check (status in ('draft','published')),
  extra jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (coach_id, name)
);
create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  view text not null check (view in ('main','front','side','video')),
  storage_path text not null unique,
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','video/mp4','video/quicktime')),
  bytes int not null check (bytes > 0 and bytes <= 52428800),
  rights text not null check (length(rights) >= 3),   -- origine et droits d'utilisation (obligatoire)
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);

-- ---------- Tests ----------
create table public.test_types (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id) on delete cascade,  -- null = type standard
  key text not null, name text not null, unit text not null,
  kind text not null default 'other' check (kind in ('rm','1rm','reps','time','distance','jump','bodyweight','other')),
  estimate_1rm boolean not null default false,
  formula text,                     -- 'epley' | 'brzycki' | null ; affichée et modifiable par le coach
  exercises text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique nulls not distinct (coach_id, key)
);
create table public.test_results (
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  key text not null,                -- champ du test (squat3, bench3, cmj, bw…) ou clé d'un type personnalisé
  value numeric not null,
  reps int, load numeric, unit text,
  note text not null default '',
  created_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (athlete_id, date, key)
);

-- ---------- Données d'entraînement de l'athlète ----------
create table public.session_logs (
  athlete_id   uuid not null references public.profiles(id) on delete cascade,
  slot_id      text not null,        -- identifiant de la séance dans le calendrier
  date         date,
  status       text check (status in ('done','adapted','missed')),
  reason       text, comment text,
  duration_min numeric check (duration_min is null or duration_min between 1 and 600),
  duration_state text check (duration_state in ('confirmed','unknown','to_complete')),
  active_s int, pause_s int, total_s int,
  rpe numeric check (rpe is null or rpe between 0 and 10),
  rpe_at timestamptz,
  adaptation jsonb, moved_to date, cond_code text,
  loads jsonb,                       -- charges prescrites au moment de la séance (historique figé)
  data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (athlete_id, slot_id)
);
create table public.wellness_entries (
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  date date not null, score numeric, data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (athlete_id, date)
);
create table public.pain_reports (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  ref text not null,
  at timestamptz not null default now(),
  location text not null, side text, intensity int check (intensity between 0 and 10),
  onset text check (onset in ('recente','habituelle','nr')),
  trigger_movement text, at_rest boolean,
  comment text not null default '', slot_id text,
  proposal jsonb, decision text,
  unique (athlete_id, ref)
);
create table public.other_activities (
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  ref text not null, date date, sport text, duration_min numeric, rpe numeric,
  data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (athlete_id, ref)
);
create table public.club_events (
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  ref text not null, data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (athlete_id, ref)
);
create table public.hr_records (
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  ref text not null, at timestamptz, data jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (athlete_id, ref)
);
-- Réglages, badges, récompenses et données diverses de l'appli (un document par athlète)
create table public.athlete_state (
  athlete_id uuid primary key references public.profiles(id) on delete cascade,
  doc jsonb not null default '{}'::jsonb,
  client_updated_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- ---------- Communication ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,   -- null = groupe du coach
  sender_id uuid references public.profiles(id) on delete set null,  -- null après suppression d'un compte (anonymisé)
  body text not null default '' check (length(body) <= 4000),
  media_path text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (sender_id, ref)
);
create index on public.messages(coach_id, client_id, created_at);
create table public.call_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('tel','visio')),
  phone text, slot text, status text not null default 'a_traiter' check (status in ('a_traiter','planifie','fait','annule')),
  created_at timestamptz not null default now(),
  unique (client_id, ref)
);
create table public.coach_reviews (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('weekly','bilan')),
  period_start date, body text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Consentements, historique, sécurité ----------
create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('cgu','donnees_sante','notifications','medias','polar')),
  version text not null, granted boolean not null,
  at timestamptz not null default now()
);
create table public.audit_log (               -- historique des modifications (coach, système)
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid references public.profiles(id) on delete set null,
  coach_id uuid references public.profiles(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  action text not null, detail jsonb not null default '{}'::jsonb
);
create table public.security_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  event text not null, ip_hash text, detail jsonb not null default '{}'::jsonb
);

-- Horodatage serveur
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at := now(); return new; end $$;
do $$ declare t text; begin
  foreach t in array array['profiles','formulas','programs','assignments','exercises','test_results','session_logs',
    'wellness_entries','other_activities','club_events','hr_records','athlete_state'] loop
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop; end $$;
