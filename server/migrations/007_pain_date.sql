-- 007 : date de la séance concernée par un signalement de douleur
alter table public.pain_reports add column if not exists date date;
