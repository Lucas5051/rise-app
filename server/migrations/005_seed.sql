-- =====================================================================
-- 005 : données de référence (aucune donnée sportive personnelle)
-- =====================================================================
-- Types de tests standards (clés identiques à celles de l'appli v9). Formule : Brzycki, déjà utilisée en v9,
-- affichée à l'athlète et au coach ; le coach peut créer ses propres types et choisir une autre formule.
insert into public.test_types (coach_id, key, name, unit, kind, estimate_1rm, formula, exercises) values
 (null,'bw','Poids de corps','kg','bodyweight',false,null,'{}'),
 (null,'cmj','Saut CMJ','cm','jump',false,null,'{}'),
 (null,'squat3','Squat 3RM','kg','rm',true,'brzycki:3','{"Squat","Squat arrière"}'),
 (null,'bench3','Développé couché 3RM','kg','rm',true,'brzycki:3','{"Développé couché"}'),
 (null,'dl3','Soulevé de terre 3RM','kg','rm',true,'brzycki:3','{"Soulevé de terre"}'),
 (null,'pullLoad3','Traction lestée 3RM (lest)','kg','rm',true,'brzycki:3+bw','{"Tractions","Traction lestée"}'),
 (null,'pullReps','Tractions au poids du corps','reps','reps',false,null,'{"Tractions"}'),
 (null,'dm8','Développé militaire haltères 8 reps','kg','rm',true,'brzycki:8','{"Développé militaire"}')
on conflict do nothing;

-- Compte coach de l'administrateur de la plateforme (rôle accordé à l'inscription par le serveur)
insert into public.coach_allowlist(email) values ('lucasbsnd10@gmail.com') on conflict do nothing;
