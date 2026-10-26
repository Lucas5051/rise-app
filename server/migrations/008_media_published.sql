-- =====================================================================
-- 008 : un client ne lit que les médias des fiches PUBLIÉES de son coach
-- Avant : la règle du stockage autorisait tout fichier du dossier du coach (y compris brouillons).
-- La visibilité d'un média suit désormais le statut de la fiche d'exercice (une seule source de vérité).
-- =====================================================================
create or replace function public.media_readable(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from exercise_media m join exercises e on e.id = m.exercise_id
     where m.storage_path = p_path and e.coach_id = public.my_coach() and e.status = 'published');
$$;
revoke execute on function public.media_readable(text) from public, anon;
grant execute on function public.media_readable(text) to authenticated;

drop policy if exists exmedia_client_read on storage.objects;
create policy exmedia_client_read on storage.objects for select to authenticated
  using (bucket_id = 'exercise-media' and public.media_readable(name));

drop policy if exists exm_client_read on public.exercise_media;
create policy exm_client_read on public.exercise_media for select to authenticated
  using (coach_id = public.my_coach() and exists(select 1 from public.exercises e where e.id = exercise_id and e.status = 'published'));
