/* =====================================================================
   MODULE 2 bis · PLATEFORME (comptes, session, rôles, invitations, formules)
   Version 3 du stockage.
   - « PL » (clé usci-platform-v3) : comptes, session, codes d'invitation, formules, journal coach, brouillon d'inscription.
   - Données sportives : une clé par athlète. Le compte de Lucas garde la clé historique « usci-muscu-state-v1 »
     pour qu'aucune donnée existante ne soit déplacée ou perdue.
   - PROTOTYPE : la séparation des rôles est SIMULÉE sur l'appareil (aucun serveur). La vraie protection
     (authentification, rôles, accès aux données) doit être faite côté serveur : voir docs/SERVEUR.md.
   - Aucun mot de passe n'est conservé, ni en clair ni chiffré, ni dans localStorage.
   ===================================================================== */
const PL_KEY="usci-platform-v3";
let PL=null;
let DATA_KEY=LS_KEY;
const SESSION_DAYS=30;
function plDefaults(){return{v:4,accounts:{},session:null,invites:[],inviteFails:[],formulas:defaultFormulas(),coachLog:[],library:{},onboardDraft:null,programs:{},assignments:{},callRequests:[],
  prefs:{units:"kg"},meta:{created:nowISO(),migrations:[]}}}
function defaultFormulas(){return{
  programmes:{name:"Programmes",price:"",engagement:"",enabled:true,recommended:false},
  perso:{name:"Programme personnalisé",price:"",engagement:"",enabled:true,recommended:true},
  coaching:{name:"Coaching",price:"",engagement:"",enabled:true,recommended:false,placesLimited:false,callsNote:""}}}
function plRead(){try{const r=localStorage.getItem(PL_KEY);return r?JSON.parse(r):null}catch(e){return null}}
function plSave(quiet){let ok=true;try{localStorage.setItem(PL_KEY,JSON.stringify(PL))}catch(e){ok=false}
  if(!quiet&&Cloud.isCloud()){clearTimeout(plSave.t);plSave.t=setTimeout(()=>{queueCoach().catch(e=>console.warn(e));queueMessages().catch(e=>console.warn(e))},600)}
  return ok}
const me=()=>PL&&PL.session&&PL.accounts[PL.session.uid]||null;
const isCoachAccount=()=>{const a=me();if(!a||a.role!=="coach")return false;
  // production : le rôle vient du profil lu sur le serveur, jamais d'une valeur locale modifiable
  if(Cloud.isCloud())return !!(Cloud.profile&&Cloud.profile.role==="coach"&&PL.session&&PL.session.uid==="coach");return true};
const sessionValid=()=>!!(PL&&PL.session&&PL.accounts[PL.session.uid]&&PL.session.exp>nowMs());
const planActive=()=>legacyActive()||!!assignmentOf(CUR_UID);
const randTok=(n=24)=>{const a=new Uint8Array(n);(crypto.getRandomValues?crypto.getRandomValues(a):a.forEach((_,i)=>a[i]=Math.random()*256|0));return [...a].map(b=>b.toString(16).padStart(2,"0")).join("")};
function startSession(uid){PL.session={uid,token:randTok(),at:nowISO(),exp:nowMs()+SESSION_DAYS*864e5,unlocked:true};plSave()}
function endSession(){if(PL){PL.session=null;plSave()}}

/* ---------- Migration v2 (appli personnelle) → v3 (plateforme) ---------- */
function platformBoot(){
  PL=plRead();
  if(PL&&(PL.v===3||PL.v===4)){const from=PL.v;PL={...plDefaults(),...PL,formulas:{...defaultFormulas(),...(PL.formulas||{})},prefs:{...plDefaults().prefs,...(PL.prefs||{})}};
    if(!isObj(PL.programs))PL.programs={};if(!isObj(PL.assignments))PL.assignments={};if(!Array.isArray(PL.callRequests))PL.callRequests=[];
    if(from===3){PL.v=4;PL.meta.migrations.push({from:3,to:4,at:nowISO(),notes:["Structure multi-client : programmes et attributions ajoutés."]})}
    ensureLucasProgram();plSave();return}
  PL=plDefaults();
  let legacyRaw=null;try{legacyRaw=localStorage.getItem(LS_KEY)}catch(e){}
  if(legacyRaw){
    // 1) Sauvegarde brute avant migration (jamais supprimée automatiquement)
    const bk="usci-muscu-backup-v2-"+todayISO();
    try{if(!localStorage.getItem(bk))localStorage.setItem(bk,legacyRaw)}catch(e){}
    // 2) Compte athlète de Lucas : garde la clé de données historique
    PL.accounts[LUCAS.uid]={id:LUCAS.uid,role:"athlete",...LUCAS.identity,email:"",provider:"migration",createdAt:nowISO(),dataKey:LS_KEY,coachId:"coach",formula:"coaching",programId:LUCAS.programId};
    PL.meta.migrations.push({from:2,to:3,at:nowISO(),notes:["Données existantes rattachées au compte athlète « Lucas Besnard » (clé inchangée).","Copie de sauvegarde : "+bk+"."]});
    startSession(LUCAS.uid);
  }
  // 3) Compte coach (simulation de rôle sur l'appareil, voir docs/SERVEUR.md)
  PL.accounts.coach={id:"coach",role:"coach",first:"Lucas",last:"Besnard",email:"",provider:"demo",createdAt:nowISO()};
  ensureLucasProgram();plSave();
}
/* Données sportives de l'athlète connecté */
function dataKeyFor(uid){const a=PL.accounts[uid];return a&&a.dataKey||("usci-muscu-data-"+uid)}
function readAthlete(uid){try{const r=localStorage.getItem(dataKeyFor(uid));return r?JSON.parse(r):null}catch(e){return null}}
/* Migration v2 → v3 des données sportives (statuts avec raisons, tests du 12/10 marqués réalisés, profil) */
function migrateV2toV3(x,uid){
  const notes=[];
  if(!isObj(x.profile))x.profile={};
  if(uid===LUCAS.uid&&x.profile.ctx!==LUCAS.ctx){x.profile={...x.profile,ctx:LUCAS.ctx,...LUCAS.identity,...LUCAS.profile};notes.push("Contexte sportif (calendrier, matchs, entraînements club) rattaché au profil de Lucas uniquement")}
  if(isObj(x.status))Object.entries(x.status).forEach(([id,v])=>{if(isObj(v)&&v.s==="fatigue"){x.status[id]={s:"missed",reason:"fatigue",comment:v.comment||"",at:v.at,from:"fatigue"};notes.push("Statut « fatigue » de "+id+" → Non réalisée (raison : fatigue)")}});
  if(uid===LUCAS.uid){
    x.status=isObj(x.status)?x.status:{};
    if(!x.status["TEST-2026-10-12"]){x.status["TEST-2026-10-12"]={s:"done",at:"2026-10-12T20:00:00.000Z",src:"tests transmis"};notes.push("Séance de tests du 12/10 marquée réalisée")}
    x.tests=Array.isArray(x.tests)?x.tests:[];const t=x.tests.find(y=>y.date==="2026-10-12");
    if(t&&!isNum(t.dm8)){t.dm8=22;notes.push("Développé militaire haltères 22 kg × 8 ajouté au test du 12/10 (performance réalisée)")}
  }
  x.v=3;x.meta=isObj(x.meta)?x.meta:{migrations:[]};if(!Array.isArray(x.meta.migrations))x.meta.migrations=[];
  if(notes.length)x.meta.migrations.push({from:2,to:3,at:nowISO(),notes});
  return x;
}
/* Version 3 → 4 des données sportives : les réglages propres à Lucas ne sont plus des valeurs par défaut ;
   ils sont recopiés dans SON profil s'ils manquaient (aucune autre donnée n'est modifiée). */
function migrateV3toV4(x,uid){const notes=[];x.settings=isObj(x.settings)?x.settings:{};
  if(uid===LUCAS.uid){Object.entries(LUCAS.settings).forEach(([k,v])=>{if(x.settings[k]==null||x.settings[k]===""){x.settings[k]=v;notes.push("Réglage « "+k+" » de Lucas conservé ("+v+")")}});notes.push("Programme historique attribué ("+LUCAS.programId+")")}
  x.meta=isObj(x.meta)?x.meta:{migrations:[]};if(!Array.isArray(x.meta.migrations))x.meta.migrations=[];x.meta.migrations.push({from:3,to:4,at:nowISO(),notes:notes.length?notes:["Aucun changement"]});return x}
/* Charge les données d'un athlète comme compte actif (connexion, création de compte, fin d'inscription) */
function loadAthlete(uid){CUR_UID=uid;DATA_KEY=dataKeyFor(uid);S=migrate(readAthlete(uid)||{});ensureSeedTests();setPeriod();REV++;lsWrite()}
/* ---------- Comptes ---------- */
function createAthlete(o){
  const id=uid("a");
  PL.accounts[id]={id,role:"athlete",first:o.first||"",last:o.last||"",email:o.email||"",provider:o.provider||"email",createdAt:nowISO(),coachId:o.coachId||null,formula:o.formula||null,programId:o.programId||null};
  plSave();
  const d=defaults();d.profile={...(o.profile||{}),first:o.first||"",last:o.last||""};d.meta.seed1210=true;// jamais les tests de Lucas
  try{localStorage.setItem(dataKeyFor(id),JSON.stringify(d))}catch(e){}
  return id;
}
const accountName=a=>a?((a.first||"")+" "+(a.last||"")).trim()||a.email||"Sans nom":"";
const athletes=()=>Object.values(PL.accounts).filter(a=>a.role==="athlete"&&(!Cloud.isCloud()||!!a.sid)); // serveur : seuls les vrais comptes

/* ---------- Codes d'invitation (prototype : stockés sur l'appareil du coach) ----------
   Uniques, personnels, à durée limitée, révocables, à usage unique, essais limités.
   En production : générés et vérifiés uniquement par le serveur (voir docs/SERVEUR.md). */
const INVITE_ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O/1/I pour éviter les confusions
function newInviteCode(){let c="";const a=new Uint8Array(8);crypto.getRandomValues(a);a.forEach(b=>c+=INVITE_ALPHA[b%INVITE_ALPHA.length]);return c.slice(0,4)+"-"+c.slice(4)}
function createInvite(draft,days=14){
  let code;do code=newInviteCode();while(PL.invites.some(i=>i.code===code));
  const inv={code,draft,createdAt:nowISO(),expiresAt:nowMs()+days*864e5,usedAt:null,revokedAt:null,usedBy:null};
  PL.invites.unshift(inv);PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Code d'invitation créé pour "+((draft.first||"")+" "+(draft.last||"")).trim()});plSave();return inv;
}
/* Limite : 5 essais ratés par tranche de 15 min (sur cet appareil) */
function inviteLocked(){const t=nowMs();PL.inviteFails=(PL.inviteFails||[]).filter(x=>t-x<15*60e3);return PL.inviteFails.length>=5}
function checkInvite(code){
  code=String(code||"").toUpperCase().replace(/[^A-Z0-9]/g,"");if(code.length===8)code=code.slice(0,4)+"-"+code.slice(4);
  if(inviteLocked())return{ok:false,msg:"Trop d'essais. Réessaie dans 15 minutes."};
  const inv=PL.invites.find(i=>i.code===code);
  const fail=()=>{PL.inviteFails.push(nowMs());plSave();return{ok:false,msg:"Code invalide ou expiré. Vérifie-le auprès de ton coach."}};
  if(!inv||inv.revokedAt||inv.usedAt||inv.expiresAt<nowMs())return fail(); // même message dans tous les cas : ne révèle rien
  return{ok:true,inv};
}
/* Lecture/écriture des données d'un autre athlète (espace coach). En production : requêtes serveur filtrées par rôle. */
function withAthlete(uid,fn){
  const pS=S,pU=CUR_UID,pK=DATA_KEY;
  CUR_UID=uid;DATA_KEY=dataKeyFor(uid);S=migrate(readAthlete(uid)||{});setPeriod();REV++;
  try{return fn()}finally{S=pS;CUR_UID=pU;DATA_KEY=pK;setPeriod();REV++}
}
function writeAthlete(uid,mutate){return withAthlete(uid,()=>{mutate(S);S.meta.updatedAt=nowISO();if(Cloud.isCloud())queueAthleteSoon(uid,deep(S));return lsWrite()})}

