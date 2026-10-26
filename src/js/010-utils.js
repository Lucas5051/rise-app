/* =====================================================================
   MODULE 1 · UTILITAIRES (dates, format, sécurité)
   ===================================================================== */
const pad=n=>String(n).padStart(2,"0");
const D=s=>new Date(s+"T12:00:00");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const diff=(a,b)=>Math.round((D(b)-D(a))/864e5); // b − a, en jours
/* window.__NOW__ ne sert qu'aux tests automatisés (simulation d'une date) */
const nowMs=()=>{const o=window.__NOW__;return o?new Date(o).getTime():Date.now()};
const todayISO=()=>iso(new Date(nowMs()));
const nowISO=()=>new Date(nowMs()).toISOString();
const JOURS=["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"];
const JOURS_C=["dim","lun","mar","mer","jeu","ven","sam"];
const MOIS=["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const fmtLong=s=>{const d=D(s);return JOURS[d.getDay()]+" "+d.getDate()+" "+MOIS[d.getMonth()]};
const fmtShort=s=>{const d=D(s);return JOURS_C[d.getDay()]+" "+d.getDate()+"/"+pad(d.getMonth()+1)};
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const dtMs=(date,time)=>{const p=String(time||"12:00").split(":");const d=D(date);d.setHours(+p[0]||0,+p[1]||0,0,0);return d.getTime()};
const hhmm=ms=>{const d=new Date(ms);return pad(d.getHours())+"h"+pad(d.getMinutes())};
const whenLabel=ms=>{const d=new Date(ms);return pad(d.getDate())+"/"+pad(d.getMonth()+1)+" à "+hhmm(ms)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,d=1)=>(Math.round(x*Math.pow(10,d))/Math.pow(10,d)).toString().replace(".",",");
/* Validation des valeurs saisies : renvoie "" si vide ou invalide, sinon la valeur bornée */
const num=(v,min,max)=>{if(v===""||v==null)return "";const x=+String(v).replace(",",".");if(!isFinite(x))return "";return Math.max(min,Math.min(max,x))};
const isNum=v=>v!==""&&v!=null&&isFinite(+v);
const isObj=x=>!!x&&typeof x==="object"&&!Array.isArray(x);
const uid=p=>p+"-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let PERIOD_START="2026-10-12",PERIOD_END="2026-12-31"; // remplacés par setPeriod() selon le programme du compte chargé

