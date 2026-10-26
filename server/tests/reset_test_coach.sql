-- Fixture du test de migration (à lancer en administrateur, jamais depuis l'appli) :
-- remet le compte coach de TEST dans l'état « données v9 pas encore importées ».
-- Les données déjà importées restent : l'import est idempotent (clés ref), le test vérifie justement l'absence de doublons.
update public.profiles set legacy_ctx = null
 where id = (select id from auth.users where email = 'coach.test@usci-muscu.test');
