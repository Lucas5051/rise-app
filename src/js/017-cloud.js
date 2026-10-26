/* =====================================================================
   DOMAINE · SERVEUR (authentification, appels sécurisés)
   Deux modes, jamais confondus :
   - « cloud » (production) : comptes, rôles, données et invitations gérés par le serveur Supabase.
   - « demo » : tout reste sur cet appareil (ancien prototype). Bandeau permanent « Mode démonstration ».
   Le mode démo s'obtient avec ?demo dans l'adresse (tests, présentation) ; il ne peut jamais lire le serveur.
   ===================================================================== */
const Cloud={sb:null,mode:"demo",user:null,profile:null,ent:[],coach:null,formula:null,ready:false,
  init(){
    const q=new URLSearchParams(location.search);let forced=null;
    try{forced=localStorage.getItem("usci-mode")}catch(e){}
    if(q.has("demo"))forced="demo";if(q.get("mode")==="cloud")forced="cloud";
    try{if(forced)localStorage.setItem("usci-mode",forced)}catch(e){}
    const lib=window.supabase&&window.supabase.createClient,cfg=APP_CONFIG.cloud;
    if(forced==="demo"||!lib||!cfg||!cfg.url){this.mode="demo";return}
    this.sb=lib(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:"usci-auth",
      storage:(Native.authStorage&&Native.authStorage())||undefined}});
    this.mode="cloud";
  },
  isCloud(){return this.mode==="cloud"},
  async session(){if(!this.sb)return null;try{const{data}=await this.sb.auth.getSession();return data.session||null}catch(e){return null}},
  async signIn(email,password){const r=await this.sb.auth.signInWithPassword({email,password});if(r.error)throw r.error;this.user=r.data.user;return r.data},
  async signUp(email,password,meta){const r=await this.sb.auth.signUp({email,password,options:{data:meta,emailRedirectTo:location.origin+location.pathname}});if(r.error)throw r.error;return r.data},
  async reset(email){const r=await this.sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+"?reset=1"});if(r.error)throw r.error},
  async newPassword(pw){const r=await this.sb.auth.updateUser({password:pw});if(r.error)throw r.error},
  async oauth(provider){const r=await this.sb.auth.signInWithOAuth({provider,options:{redirectTo:location.origin+location.pathname}});if(r.error)throw r.error;return r.data},
  async signOut(all){try{await this.sb.auth.signOut({scope:all?"global":"local"})}catch(e){}this.user=null;this.profile=null;this.ent=[]},
  async rpc(fn,args){const r=await this.sb.rpc(fn,args||{});if(r.error)throw r.error;return r.data},
  async loadMe(){const s=await this.session();if(!s)return null;this.user=s.user;
    const p=await this.sb.from("profiles").select("*").eq("id",s.user.id).maybeSingle();if(p.error)throw p.error;this.profile=p.data;
    try{this.ent=await this.rpc("my_entitlements")||[]}catch(e){this.ent=[]}
    return this.profile},
  /* Fonctions serveur (Edge Functions) : la clé d'administration n'existe que côté serveur */
  async fn(name,body){const s=await this.session();const cfg=APP_CONFIG.cloud;
    const r=await fetch(cfg.url+"/functions/v1/"+name,{method:"POST",headers:{"Content-Type":"application/json",apikey:cfg.publishableKey,Authorization:"Bearer "+(s?s.access_token:cfg.publishableKey)},body:JSON.stringify(body||{})});
    let j={};try{j=await r.json()}catch(e){}if(!r.ok&&!j.error)j={ok:false,error:"http_"+r.status};return j}
};
/* Messages d'erreur de connexion compréhensibles (sans révéler si un compte existe) */
function authErrText(e){const m=String(e&&e.message||e||"");
  if(/Invalid login|invalid_credentials/i.test(m))return "Adresse e-mail ou mot de passe incorrect.";
  if(/Email not confirmed/i.test(m))return "Confirme d'abord ton adresse avec le lien reçu par e-mail.";
  if(/not authorized|Email address not authorized/i.test(m))return "L'envoi d'e-mails n'est pas encore configuré sur le serveur (adresse d'envoi à paramétrer). Demande un code d'invitation à ton coach.";
  if(/provider is not enabled|Unsupported provider/i.test(m))return "Cette méthode de connexion n'est pas encore activée sur le serveur. Utilise ton adresse e-mail.";
  if(/rate limit|too many/i.test(m))return "Trop de tentatives. Réessaie dans quelques minutes.";
  if(/Failed to fetch|NetworkError|network/i.test(m))return "Pas de connexion internet. Réessaie quand tu es connecté.";
  return "Connexion impossible pour le moment. Réessaie.";}
/* Droits de la formule : fournis par le serveur en production ; simulés sur l'appareil en démonstration */
const ENT_L={predefined_programs:"Programmes prédéfinis",individual_program:"Programme individualisé",custom_tests:"Tests personnalisés",auto_loads:"Calcul automatique des charges",
  auto_adapt:"Adaptations automatiques",private_messaging:"Messagerie privée",group_messaging:"Groupe",weekly_follow:"Suivi hebdomadaire",coach_review:"Bilan coach",
  calls:"Appels et visios",advanced_stats:"Statistiques avancées",extended_history:"Historique étendu"};
const ENT_DEFAULT={programmes:["predefined_programs"],perso:["predefined_programs","individual_program","custom_tests","auto_loads","auto_adapt","weekly_follow"],
  coaching:Object.keys(ENT_L)};
function entitlements(){
  if(Cloud.isCloud())return isCoachAccount()?Object.keys(ENT_L):(Cloud.ent||[]);
  if(isCoachAccount())return Object.keys(ENT_L);
  const a=PL&&PL.accounts&&PL.accounts[CUR_UID];if(!a)return[];
  const k=a.formula||(a.formulaRequest&&a.formulaRequest.k);if(!k)return legacyActive()?Object.keys(ENT_L):[];
  const f=PL.formulas[k];return (f&&Array.isArray(f.ent)?f.ent:ENT_DEFAULT[k])||[];
}
const can=k=>entitlements().includes(k);
/* Bloc « fonction non incluse » : explique, ne contourne jamais la règle (le serveur refuse de toute façon) */
const lockedCard=(k,why)=>`<section class="card locked" role="note"><h3>${ICONS.lock||"🔒"} ${esc(ENT_L[k]||k)} : non inclus dans ta formule</h3><p class="small">${esc(why||"Cette fonction fait partie d'une formule supérieure. Parles-en à ton coach.")}</p></section>`;
