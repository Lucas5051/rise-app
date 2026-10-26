-- =====================================================================
-- Tests de sécurité et d'isolation (exécutés dans une transaction annulée à la fin :
-- aucune donnée ne reste, y compris sur le serveur de production).
-- Usage : psql -f security_tests.sql   (ou via l'outil SQL de Supabase)
-- =====================================================================
begin;
create temp table t_res(n serial, ok boolean, msg text);
grant all on t_res to public; grant all on sequence t_res_n_seq to public;
create function pg_temp.ok(c boolean, m text) returns void language sql as $$ insert into t_res(ok,msg) values (coalesce(c,false), m) $$;
create function pg_temp.as_user(u uuid) returns void language plpgsql as $$ begin
  perform set_config('request.jwt.claims', json_build_object('sub',u,'role','authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u::text, true);
  execute 'set local role authenticated'; end $$;
create function pg_temp.as_service() returns void language plpgsql as $$ begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true); perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role service_role'; end $$;
create function pg_temp.as_admin() returns void language plpgsql as $$ begin execute 'reset role';
  perform set_config('request.jwt.claims', '', true); perform set_config('request.jwt.claim.sub', '', true); end $$;
create temp table t_ids(k text primary key, v text); grant all on t_ids to public;

-- Comptes de test
insert into coach_allowlist(email) values ('t-coach1@test.invalid'),('t-coach2@test.invalid') on conflict do nothing;
insert into auth.users(id,email,raw_user_meta_data) values
 ('00000000-0000-4000-8000-0000000000c1','t-coach1@test.invalid','{"first_name":"Coach","last_name":"Un"}'),
 ('00000000-0000-4000-8000-0000000000c2','t-coach2@test.invalid','{}'),
 ('00000000-0000-4000-8000-0000000000a1','t-ath1@test.invalid','{}'),
 ('00000000-0000-4000-8000-0000000000a2','t-ath2@test.invalid','{}'),
 ('00000000-0000-4000-8000-0000000000a3','t-ath3@test.invalid','{}');
select pg_temp.ok((select role from profiles where id='00000000-0000-4000-8000-0000000000c1')='coach','Rôle coach attribué par le serveur (liste blanche)');
select pg_temp.ok((select role from profiles where id='00000000-0000-4000-8000-0000000000a1')='athlete','Nouveau compte = athlète par défaut');
select pg_temp.ok((select count(*) from formulas where coach_id='00000000-0000-4000-8000-0000000000c1')=3,'3 formules créées pour le coach');

-- Le coach 1 crée un programme et une invitation
select pg_temp.as_user('00000000-0000-4000-8000-0000000000c1');
select public.save_program('{"id":"prog-t1","name":"Prog test","version":1,"rules":{"volume":true,"upper":false},"blocks":[{"id":"pb1","name":"Bloc 1","weeks":[{"id":"pw1","label":"S1","sessions":[{"id":"ps1","day":0,"name":"Force","dur":60,"wuMin":10,"cdMin":5,"wu":[{"n":"Vélo","dose":"5 min"}],"main":[{"n":"Squat","sets":4,"reps":"5","presc":{"mode":"pct1rm","ref":"squat","pct":80,"round":2.5}}],"cd":[]}]},{"id":"pw2","label":"S2","sessions":[]}]}]}'::jsonb);
insert into t_ids select 'tpl', id::text from programs where ref='prog-t1';
insert into t_ids select 'inv', public.create_invite('{"draft":{"first":"Alex","last":"Test"},"email":"t-ath1@test.invalid","formula":"perso","programRef":"prog-t1","startDate":"2026-11-02","days":14}'::jsonb)->>'code';
insert into t_ids select 'inv2', public.create_invite('{"draft":{"first":"B"},"formula":"programmes","days":14}'::jsonb)->>'code';
insert into t_ids select 'inv3', public.create_invite('{"draft":{"first":"C"},"formula":"perso","days":14}'::jsonb)->>'code';
select pg_temp.ok((select v from t_ids where k='inv') ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$','Code généré côté serveur au format XXXX-XXXX');
select pg_temp.ok(not exists(select 1 from public.coach_invites() i, t_ids t where t.k='inv' and convert_to(t.v,'UTF8') = i.code_hash),'Code non stocké en clair');
select pg_temp.as_admin();
select pg_temp.ok((select count(*) from invites where code_hash = public._hash_code((select v from t_ids where k='inv')))=1,'Seule l''empreinte SHA-256 du code est conservée');

-- Aperçu et utilisation (rôle serveur)
select pg_temp.as_service();
select pg_temp.ok((public.invite_preview((select v from t_ids where k='inv'),'ip-a'))->>'program'='Prog test','Aperçu : programme préparé reconnu');
select pg_temp.ok((public.invite_preview(lower(replace((select v from t_ids where k='inv'),'-','')),'ip-a'))->>'ok'='true','Code accepté sans tiret et en minuscules');
select pg_temp.ok((public.invite_redeem((select v from t_ids where k='inv'),'ip-a','00000000-0000-4000-8000-0000000000a1','{"first":"Alexandre"}'))->>'ok'='true','Invitation utilisée → compte lié');
select pg_temp.ok((public.invite_redeem((select v from t_ids where k='inv'),'ip-b','00000000-0000-4000-8000-0000000000a3','{}'))->>'error'='invalid','Code déjà utilisé : refusé');
select pg_temp.ok((public.invite_preview('ZZZZ-ZZZZ','ip-b'))->>'error'='invalid','Code inconnu : même message générique « invalid »');
select pg_temp.as_admin();
update invites set expires_at = now() - interval '1 minute' where code_hash = public._hash_code((select v from t_ids where k='inv3'));
select pg_temp.as_service();
select pg_temp.ok((public.invite_preview((select v from t_ids where k='inv3'),'ip-c'))->>'error'='invalid','Code expiré : refusé, même message');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000c1');
select public.revoke_invite((select id from public.coach_invites() where code_hint = right(replace((select v from t_ids where k='inv2'),'-',''),2) and used_at is null and revoked_at is null and expires_at > now() limit 1));
select pg_temp.as_service();
select pg_temp.ok((public.invite_preview((select v from t_ids where k='inv2'),'ip-d'))->>'error'='invalid','Code révoqué : refusé, même message');
select public.invite_preview('AAAA-AAA'||g::text,'ip-flood') from generate_series(1,5) g;
select pg_temp.ok((public.invite_preview((select v from t_ids where k='inv'),'ip-flood'))->>'error'='locked','5 essais ratés : blocage 15 min de cette adresse');
select pg_temp.as_admin();
select pg_temp.ok((select first_name from profiles where id='00000000-0000-4000-8000-0000000000a1')='Alexandre','Correction autorisée par l''athlète appliquée');
select pg_temp.ok((select role from profiles where id='00000000-0000-4000-8000-0000000000a1')='athlete','Le code ne donne pas le rôle coach');

-- Athlète 1 : voit SON programme, ne peut rien modifier côté coach
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select pg_temp.ok(jsonb_array_length(public.assignments_json())=1,'Programme attribué visible par le client');
select pg_temp.ok((public.assignments_json()->0->'prog'->'blocks'->0->'weeks'->0->'sessions'->0->>'name')='Force','Séances du programme lisibles (calendrier)');
select pg_temp.ok((public.assignments_json()->0->>'startDate')='2026-11-02','Date de démarrage choisie par le coach');
select pg_temp.ok((select count(*) from programs where kind='template')=0,'Le client ne voit pas les modèles du coach');
select pg_temp.ok(public.program_to_json((select v::uuid from t_ids where k='tpl')) is null,'Client : modèle illisible même via la fonction de lecture (009)');
do $$ begin perform public._phase_rows(gen_random_uuid(),'main'); perform pg_temp.ok(false,'_phase_rows interne');
  exception when insufficient_privilege then perform pg_temp.ok(true,'Fonction interne _phase_rows inaccessible au client (009)'); end $$;
do $$ begin perform public.save_program('{"id":"prog-t1","name":"Piraté","blocks":[]}'::jsonb); perform pg_temp.ok(false,'Client ne peut pas modifier un modèle');
  exception when others then perform pg_temp.ok(true,'Client ne peut pas modifier un modèle (save_program refusé)'); end $$;
update programs set name='Piraté';
select pg_temp.ok((select count(*) from programs where name='Piraté')=0,'UPDATE direct sur les programmes : 0 ligne modifiée');
do $$ begin update profiles set role='coach' where id=auth.uid(); perform pg_temp.ok(false,'Client ne peut pas devenir coach');
  exception when others then perform pg_temp.ok(true,'Client ne peut pas devenir coach (rôle protégé)'); end $$;
do $$ begin insert into coach_clients(coach_id,client_id) values ('00000000-0000-4000-8000-0000000000c2',auth.uid()); perform pg_temp.ok(false,'Client ne peut pas se rattacher seul');
  exception when others then perform pg_temp.ok(true,'Client ne peut pas se rattacher seul à un coach'); end $$;
do $$ begin update coach_clients set formula_id=(select id from formulas where key='coaching' limit 1) where client_id=auth.uid();
  perform pg_temp.ok((select f.key from coach_clients cc join formulas f on f.id=cc.formula_id where cc.client_id=auth.uid())='perso','Client ne peut pas changer sa formule'); end $$;
do $$ begin perform public.invite_redeem('AAAA-BBBB','x',auth.uid(),'{}'); perform pg_temp.ok(false,'Client ne peut pas appeler les fonctions serveur');
  exception when insufficient_privilege then perform pg_temp.ok(true,'Fonctions réservées au serveur (invitation, purge) inaccessibles au client'); end $$;
do $$ begin perform public.purge_user(auth.uid()); perform pg_temp.ok(false,'purge');
  exception when insufficient_privilege then perform pg_temp.ok(true,'Un client ne peut pas lancer la purge d''un compte'); end $$;
-- Séance réalisée
insert into session_logs(athlete_id,slot_id,date,status,duration_min,duration_state,rpe,client_updated_at) values (auth.uid(),'G-x-ps1','2026-11-02','done',58,'confirmed',7,'2026-11-02T19:00:00Z');
select pg_temp.ok((select count(*) from session_logs)=1,'Séance enregistrée par l''athlète');
-- Conflit : une version plus ancienne n'écrase pas la plus récente ; pas de doublon
insert into session_logs(athlete_id,slot_id,status,rpe,client_updated_at) values (auth.uid(),'G-x-ps1','missed',null,'2026-11-02T18:00:00Z')
  on conflict (athlete_id,slot_id) do update set status=excluded.status, rpe=excluded.rpe, client_updated_at=excluded.client_updated_at;
select pg_temp.ok((select status||rpe from session_logs where slot_id='G-x-ps1')='done7','Envoi plus ancien ignoré (dernière modification conservée)');
select pg_temp.ok((select count(*) from session_logs where slot_id='G-x-ps1')=1,'Renvoi du même envoi : aucun doublon');
-- Formule « perso » : pas de messagerie privée ; pas de bilan coach
do $$ begin insert into messages(ref,coach_id,client_id,sender_id,body) values ('m1','00000000-0000-4000-8000-0000000000c1',auth.uid(),auth.uid(),'Salut');
  perform pg_temp.ok(false,'Messagerie bloquée hors formule'); exception when others then perform pg_temp.ok(true,'Formule sans messagerie : envoi refusé par le serveur'); end $$;
select pg_temp.ok(not ('private_messaging' = any(public.my_entitlements())),'Droits calculés par le serveur (perso : pas de messagerie)');
select pg_temp.ok('auto_loads' = any(public.my_entitlements()),'Formule perso : calcul des charges inclus');

-- Coach 1 lit les données de son client, personnalise sans toucher au modèle
select pg_temp.as_user('00000000-0000-4000-8000-0000000000c1');
select pg_temp.ok((select duration_min from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a1' and slot_id='G-x-ps1')=58,'Le coach voit la durée réelle');
select pg_temp.ok((select rpe from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a1')=7,'Le coach voit le RPE');
select public.save_program(jsonb_set(public.program_to_json((select copy_program_id from assignments where client_id='00000000-0000-4000-8000-0000000000a1')),'{name}','"Prog test (Alex)"'),
  'client_copy','00000000-0000-4000-8000-0000000000a1',(select 'asg:'||ref from assignments where client_id='00000000-0000-4000-8000-0000000000a1'));
select pg_temp.ok((select name from programs where ref='prog-t1')='Prog test','Personnalisation client : modèle d''origine inchangé');
select pg_temp.ok((select name from programs where kind='client_copy' and client_id='00000000-0000-4000-8000-0000000000a1')='Prog test (Alex)','Copie du client personnalisée');
select pg_temp.ok((public.program_to_json((select id from programs where ref='prog-t1'))->'blocks'->0->'weeks'->0->'sessions'->0->'main'->0->'presc'->>'mode')='pct1rm','Prescription structurée conservée');
update coach_clients set formula_id=(select id from formulas where coach_id=auth.uid() and key='coaching') where client_id='00000000-0000-4000-8000-0000000000a1';
insert into messages(ref,coach_id,client_id,sender_id,body) values ('g1',auth.uid(),null,auth.uid(),'Bienvenue au groupe');

-- Formule coaching : messagerie autorisée
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
insert into messages(ref,coach_id,client_id,sender_id,body) values ('m2','00000000-0000-4000-8000-0000000000c1',auth.uid(),auth.uid(),'Séance faite');
insert into messages(ref,coach_id,client_id,sender_id,body) values ('m3','00000000-0000-4000-8000-0000000000c1',null,auth.uid(),'Salut le groupe');
select pg_temp.ok((select count(*) from messages)=3,'Formule coaching : messagerie privée et groupe accessibles');

-- Coach 2 et athlète 2 : aucune donnée de l'athlète 1
select pg_temp.as_admin();
insert into coach_clients(coach_id,client_id,formula_id) values ('00000000-0000-4000-8000-0000000000c2','00000000-0000-4000-8000-0000000000a2',(select id from formulas where coach_id='00000000-0000-4000-8000-0000000000c2' and key='coaching'));
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a2');
insert into session_logs(athlete_id,slot_id,status) values (auth.uid(),'X1','done');
select pg_temp.ok((select count(*) from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a1')=0,'Un client ne lit pas les séances d''un autre client');
select pg_temp.ok((select count(*) from profiles where id='00000000-0000-4000-8000-0000000000a1')=0,'Un client ne lit pas le profil d''un autre client');
select pg_temp.ok((select count(*) from messages)=0,'Un client ne lit pas les messages d''un autre coach');
select pg_temp.ok((select count(*) from programs)=0,'Un client ne lit pas les programmes d''un autre client');
do $$ begin insert into session_logs(athlete_id,slot_id,status) values ('00000000-0000-4000-8000-0000000000a1','X2','done'); perform pg_temp.ok(false,'écriture chez autrui');
  exception when others then perform pg_temp.ok(true,'Un client ne peut pas écrire dans les données d''un autre'); end $$;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000c2');
select pg_temp.ok((select count(*) from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a1')=0,'Un coach ne voit pas les clients d''un autre coach');
do $$ begin perform public.coach_snapshot(); perform pg_temp.ok(jsonb_array_length(public.coach_snapshot()->'clients')=1,'Le coach 2 ne voit que son client'); end $$;

-- Export : toutes les données, aucun secret
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
select pg_temp.ok(jsonb_array_length(public.export_my_data()->'logs')=1 and jsonb_array_length(public.export_my_data()->'messages')>=2,'Export : séances et messages inclus');
select pg_temp.ok(public.export_my_data()::text !~* '(password|encrypted_password|code_hash|service_role)','Export : aucun mot de passe ni secret');
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a2');
select pg_temp.ok(public.export_my_data()->'profile'->>'email'='t-ath2@test.invalid' and jsonb_array_length(public.export_my_data()->'logs')=1,'Export limité au compte connecté');

-- Suppression de l'athlète 1
select pg_temp.as_service();
select pg_temp.ok((public.purge_user('00000000-0000-4000-8000-0000000000a1'))->>'ok'='true','Purge préparée');
select pg_temp.as_admin();
delete from auth.users where id='00000000-0000-4000-8000-0000000000a1';
select pg_temp.ok((select count(*) from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a1')=0,'Suppression : séances supprimées');
select pg_temp.ok((select count(*) from programs where client_id='00000000-0000-4000-8000-0000000000a1')=0,'Suppression : copie de programme supprimée');
select pg_temp.ok((select count(*) from messages where body='Salut le groupe')=0 and (select count(*) from messages where sender_id is null and client_id is null)=1,'Suppression : message de groupe anonymisé');
select pg_temp.ok((select count(*) from audit_log where client_id='00000000-0000-4000-8000-0000000000a1')=0,'Suppression : historique restant anonymisé');
select pg_temp.ok((select count(*) from session_logs where athlete_id='00000000-0000-4000-8000-0000000000a2')=1,'Suppression : autres clients non affectés');
select pg_temp.ok((select name from programs where ref='prog-t1')='Prog test','Suppression : modèle du coach conservé');

select n, case when ok then 'PASS' else 'FAIL' end as res, msg from t_res order by n;
select count(*) filter (where ok) as reussis, count(*) filter (where not ok) as echoues from t_res;
rollback;
