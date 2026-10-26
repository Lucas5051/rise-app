-- =====================================================================
-- 004 : stockage des fichiers (Supabase Storage) — médias d'exercices et médias des clients
-- Les fichiers ne sont plus dans localStorage. Compartiments privés : lecture par URL signée temporaire.
-- Chemins : exercise-media/<coach_id>/<exercise_id>/<fichier>   user-media/<user_id>/<fichier>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('exercise-media','exercise-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']),
  ('user-media','user-media', false, 10485760, array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Médias d'exercices : le coach écrit dans son dossier ; ses clients lisent
create policy exmedia_coach_all on storage.objects for all to authenticated
  using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_coach())
  with check (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = auth.uid()::text and public.is_coach());
create policy exmedia_client_read on storage.objects for select to authenticated
  using (bucket_id = 'exercise-media' and (storage.foldername(name))[1] = public.my_coach()::text);

-- Médias personnels (photos de la messagerie) : propriétaire ; lecture par son coach
create policy umedia_self on storage.objects for all to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy umedia_coach_read on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and exists(select 1 from public.coach_clients cc where cc.coach_id = auth.uid() and cc.client_id::text = (storage.foldername(name))[1]));
