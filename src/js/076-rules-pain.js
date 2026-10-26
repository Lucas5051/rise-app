/* =====================================================================
   DOMAINE · RÈGLES D'ADAPTATION DU COACH ET DOULEUR LOCALISÉE
   1. Les adaptations cochées par le coach dans le programme sont RÉELLEMENT appliquées :
      une adaptation interdite n'est jamais proposée ni appliquée ; l'appli cherche une option autorisée
      plus prudente ; sinon elle invite à contacter le coach. Le coach voit la règle utilisée.
   2. Douleur : plus de règle « douleur = haut du corps ». L'appli demande la zone, l'intensité, l'apparition,
      le mouvement déclencheur, la gêne au repos. Elle propose une option prudente expliquée, sans aucun diagnostic.
      Douleur importante, au repos ou persistante → arrêt des exercices concernés et avis d'un professionnel de santé.
   Sources : aucune règle de localisation de la douleur n'existe dans les cours fournis. Les correspondances
   zone ↔ exercices ci-dessous sont une INTERPRÉTATION prudente de l'appli (retirer ce qui sollicite la zone),
   à valider par le coach. Le seuil « intensité ≥ 7/10 » est un choix de l'appli, pas une donnée des cours.
   ===================================================================== */
const MODE_RULE={volume:"volume",power:"power",micro:"micro",upper:"upper",active:"active",targeted:"targeted",painTargeted:"targeted"};
/* Options de repli, de la plus proche à la plus prudente (moins de charge) */
const FALLBACK={targeted:["volume","active","micro"],volume:["active","micro"],power:["volume","micro","active"],micro:["active"],upper:["active"],active:["micro"],painTargeted:["active"]};
function asgFor(s){if(s&&s.aid&&PL.assignments[s.aid])return PL.assignments[s.aid];if(legacyActive())return PL.assignments[LUCAS.assignmentId]||assignmentOf(CUR_UID);return assignmentOf(CUR_UID)}
function rulesFor(s){const a=asgFor(s);const r=a&&a.prog&&a.prog.rules;return{...DEFAULT_RULES,...(isObj(r)?r:{})}}
const ruleOk=(s,mode)=>{const k=MODE_RULE[mode];return !k||rulesFor(s)[k]!==false};
const RULE_LBL=k=>RULE_L[MODE_RULE[k]||k]||ADAPT_LABEL[k]||k;

/* ---------- Douleur ---------- */
const PAIN_ZONES=[["epaule","Épaule"],["coude","Coude"],["poignet","Poignet / main"],["cou","Cou"],["haut_dos","Haut du dos"],["bas_dos","Bas du dos (lombaires)"],["hanche","Hanche"],["aine","Aine / adducteurs"],["cuisse_av","Avant de la cuisse"],["ischios","Arrière de la cuisse (ischios)"],["genou","Genou"],["mollet","Mollet / tendon d'Achille"],["cheville","Cheville / pied"],["autre","Autre zone"]];
const PAIN_ZL=k=>(PAIN_ZONES.find(z=>z[0]===k)||[k,k])[1];
/* Exercices qui sollicitent la zone : étiquettes de l'exercice (z) + mots du nom. Interprétation prudente de l'appli. */
const PAIN_MATCH={
  epaule:{re:/d[ée]velopp[ée]|militaire|pompe|dips|[ée]l[ée]vation|face pull|traction|tirage|rowing|landmine|lancer|m[ée]decine|arrach|jet[ée]|overhead|y-t-w|rotation externe/i},
  coude:{re:/curl|extension triceps|triceps|d[ée]velopp[ée]|pompe|dips|traction|tirage|rowing/i},
  poignet:{re:/curl|d[ée]velopp[ée]|pompe|dips|traction|tirage|rowing|soulev[ée]|planche|gainage sur les mains|kettlebell/i},
  cou:{re:/militaire|overhead|shrug|squat arri[èe]re|traction|nuque/i},
  haut_dos:{re:/tirage|rowing|traction|face pull|soulev[ée]|militaire/i},
  bas_dos:{re:/soulev[ée]|roumain|squat|good morning|hip thrust|rowing|swing|kettlebell|traîneau|tra[iî]neau|fente|bulgare|sprint/i,z:["post"]},
  hanche:{re:/squat|fente|bulgare|hip thrust|pont|soulev[ée]|roumain|saut|bond|sprint|copenhag|adduct/i,z:["plyo","add"]},
  aine:{re:/copenhag|adduct|fente lat|sprint|changement de direction|saut lat/i,z:["add"]},
  cuisse_av:{re:/squat|fente|bulgare|leg extension|step|saut|bond|sprint|tra[iî]neau/i,z:["quad","plyo"]},
  ischios:{re:/nordic|roumain|soulev[ée]|leg curl|good morning|hip thrust|sprint|pont/i,z:["post"]},
  genou:{re:/squat|fente|bulgare|leg extension|step|saut|bond|sprint|pliom|tra[iî]neau|nordic/i,z:["quad","plyo"]},
  mollet:{re:/mollet|saut|bond|sprint|corde|pliom|pogo/i,z:["calf","plyo"]},
  cheville:{re:/mollet|saut|bond|sprint|corde|pliom|pogo|fente|squat/i,z:["calf","plyo"]},
  autre:{re:/$^/}
};
const painHits=(e,zone)=>{const m=PAIN_MATCH[zone]||PAIN_MATCH.autre;if(e.check)return false;return m.re.test(e.n||"")||(m.z||[]).some(z=>(e.z||[]).includes(z))||((zone==="genou"||zone==="mollet"||zone==="cheville"||zone==="hanche")&&(e.plyo||e.sprint))};
/* Signalement le plus récent (3 jours avant la séance au plus) */
function painFor(date){const L=Object.entries(S.pain||{}).map(([id,p])=>({id,...p})).filter(p=>p.date&&diff(p.date,date)>=0&&diff(p.date,date)<=3&&p.decision!=="resolu");
  return L.sort((a,b)=>a.at<b.at?1:-1)[0]||null}
const painSerious=p=>p&&((+p.intensity>=7)||p.atRest===true||(p.onset==="habituelle"&&+p.intensity>=5)||p.zone==="autre");
const PAIN_ADVICE="L'appli ne pose aucun diagnostic. Si la douleur est inhabituelle, importante ou persiste, arrête les exercices concernés et demande l'avis d'un professionnel de santé.";
function painPlan(s,base){
  const p=painFor(s.date);const r={...base,pain:true,level:2,notes:[...(base.notes||[])]};
  if(!p){return{...r,mode:"painAsk",label:"Précise ta douleur",changes:["Indique où tu as mal pour que la proposition évite cette zone."],
    why:["Une douleur est signalée, mais sa zone n'est pas connue : aucune séance de remplacement n'est proposée à l'aveugle (une douleur à l'épaule ou au dos peut rendre une séance « haut du corps » inadaptée).",PAIN_ADVICE],
    effect:"Choisir une adaptation qui ne sollicite pas la zone douloureuse.",ask:true}}
  const zl=PAIN_ZL(p.zone)+(p.side&&p.side!=="nr"?" ("+p.side+")":"");
  r.trig=[...(r.trig||[]),`Douleur signalée le ${fmtShort(p.date)} : ${zl}, ${isNum(p.intensity)?p.intensity+"/10":"intensité non précisée"}, ${p.onset==="habituelle"?"habituelle":p.onset==="recente"?"apparition récente":"apparition non précisée"}${p.atRest?", présente au repos":""}${p.trigger?", déclenchée par : "+p.trigger:""}`];
  if(painSerious(p))return{...r,mode:"rest",label:"Repos et avis d'un professionnel",painRef:p.id,painZone:p.zone,changes:["Séance non réalisée aujourd'hui","Mobilité très légère seulement si elle ne réveille aucune douleur"],
    why:[(+p.intensity>=7?"Douleur importante ("+p.intensity+"/10). ":"")+(p.atRest?"Douleur présente au repos. ":"")+(p.onset==="habituelle"?"Douleur qui revient. ":"")+(p.zone==="autre"?"Zone non reconnue par l'appli. ":"")+"Par prudence, l'appli ne propose pas d'exercice de remplacement.",PAIN_ADVICE],
    effect:"Ne pas charger une zone douloureuse et laisser un professionnel de santé évaluer la situation."};
  const items=tpl(s).fn(s);const hit=items.filter(e=>painHits(e,p.zone));
  if(!hit.length)return{...r,mode:"none",label:ADAPT_LABEL.none,changes:["Aucun exercice de la séance ne sollicite directement la zone indiquée."],
    why:["Les exercices prévus ne semblent pas solliciter : "+zl+". Arrête tout exercice qui réveille la douleur.",PAIN_ADVICE],effect:"Séance conservée, vigilance sur les sensations.",painRef:p.id};
  if(hit.length>items.filter(e=>!e.check).length/2)return{...r,mode:"active",label:ADAPT_LABEL.active,painRef:p.id,painZone:p.zone,
    changes:["La plupart des exercices sollicitent la zone douloureuse : séance remplacée par une récupération active qui ne la sollicite pas (marche, vélo ou natation selon la zone, sans douleur)"],
    why:[hit.length+" exercice(s) sur "+items.length+" sollicitent "+zl+".",PAIN_ADVICE],effect:"Garder une activité légère sans charger la zone."};
  return{...r,mode:"painTargeted",label:"Retrait ciblé (douleur)",painRef:p.id,painZone:p.zone,
    changes:hit.map(e=>"Retiré : "+e.n+(e.alt&&e.alt!=="—"?" (alternative possible si elle est indolore : "+e.alt+")":"")).concat(["Les autres exercices sont conservés, sans douleur"]),
    why:["Ces exercices sollicitent la zone douloureuse ("+zl+"). Correspondance établie par l'appli, à valider par ton coach.",PAIN_ADVICE],
    effect:"Continuer à t'entraîner sans charger la zone douloureuse."};
}
/* ---------- Application des règles du coach ---------- */
function enforceRules(s,r){
  const R=rulesFor(s);const out={...r,rule:{asked:r.mode,used:r.mode,refused:[],auto:true}};
  if(r.mode==="none"||r.mode==="painAsk"||r.mode==="rest")return out;
  if(!can("auto_adapt")){return{...out,mode:"coach",label:"Parles-en à ton coach",level:Math.max(1,r.level),changes:["Ta formule ne comprend pas les adaptations automatiques : ton coach décide des changements."],
    why:[...r.why],effect:"Ton coach adapte la séance s'il le juge utile.",rule:{...out.rule,used:"coach",entitlement:"auto_adapt"}}}
  if(ruleOk(s,r.mode))return out;
  out.rule.refused.push(r.mode);
  for(const m of FALLBACK[r.mode]||[]){if(ruleOk(s,m)){
    const base=recoChanges(m,r);return{...out,mode:m,label:ADAPT_LABEL[m],changes:base,level:Math.max(r.level,m==="active"||m==="micro"?2:1),
      why:[...r.why,"« "+RULE_LBL(r.mode)+" » n'est pas autorisée par ton coach pour ce programme : l'appli propose une option autorisée plus prudente."],rule:{...out.rule,used:m}}}
    out.rule.refused.push(m)}
  return{...out,mode:"coach",label:"Contacte ton coach",level:Math.max(1,r.level),changes:["Aucune adaptation automatique autorisée ne convient : la séance n'est pas modifiée sans l'accord de ton coach."],
    why:[...r.why,"Adaptations non autorisées par ton coach : "+out.rule.refused.map(RULE_LBL).join(", ")+"."],effect:"Ton coach décide de l'adaptation.",rule:{...out.rule,used:"coach"}};
}
function recoChanges(m,r){return({volume:["1 série de moins par exercice","RIR + 1 sur les exercices de force"],power:["Sauts, sprints et lancers supprimés","Exercices de force conservés"],
  micro:["Séance remplacée par une microdose de 20 min : sauts, lancers, gainage"],upper:["Séance remplacée par haut du corps + mobilité + prévention légère"],
  active:["Séance remplacée par 30-40 min de vélo ou natation à 50-60 % FC max + mobilité"],targeted:(r.targets||[]).map(t=>"1 série de moins sur : "+(ZONE_LABEL[t]||t))}[m])||[]}
function recommend(s){let r=recommendRaw(s);if(r.mode==="pain"||painFor(s.date))r=painPlan(s,r);return enforceRules(s,r)}
/* Adaptations choisies par l'athlète (alléger, remplacer, déplacer) : soumises aux mêmes règles */
function athleteMayAdapt(s,mode){if(!ruleOk(s,mode)){toast("« "+RULE_LBL(mode)+" » n'est pas autorisée par ton coach pour ce programme. Écris-lui si besoin.");return false}return true}
function athleteMayMove(s){if(rulesFor(s).move===false){toast("Ton coach n'autorise pas le déplacement des séances de ce programme. Écris-lui si besoin.");return false}return true}
const ruleTxt=a=>a&&a.rule?(a.rule.used==="coach"?"Renvoyé au coach":"Règle appliquée : "+RULE_LBL(a.rule.used))+(a.rule.refused&&a.rule.refused.length?" · refusé par le programme : "+a.rule.refused.map(RULE_LBL).join(", "):"")+(a.rule.auto?" · proposé par l'appli, confirmé par l'athlète":" · choisi par l'athlète"):"";

/* ---------- Formulaire de douleur ---------- */
let PAIN_SLOT=null;
function openPain(slotId){PAIN_SLOT=slotId||null;const s=slotId&&sessionById(slotId);
  openSheet(`<div class="sheet-scroll">`+head("Signaler une douleur",s?esc(tpl(s).name)+" · "+fmtShort(s.date):"Aujourd'hui")+`<form class="stack" id="painForm" novalidate>
   <div class="field"><label for="pnZone">Où as-tu mal ?</label><select id="pnZone" required><option value="">Choisir la zone</option>${PAIN_ZONES.map(([k,l])=>`<option value="${k}">${l}</option>`).join("")}</select></div>
   <div class="field"><span class="lbl" id="pnSideL">Côté</span><div class="toggles" role="radiogroup" aria-labelledby="pnSideL">${[["gauche","Gauche"],["droite","Droite"],["les deux","Les deux"],["nr","Sans objet"]].map(([k,l])=>`<button type="button" class="toggle" role="radio" data-pnside="${k}" aria-checked="false" aria-pressed="false">${l}</button>`).join("")}</div></div>
   <div class="field"><label for="pnInt">Intensité : <b id="pnIntV">—</b>/10</label><input id="pnInt" type="range" min="0" max="10" step="1" value="3" aria-describedby="pnIntH"><p class="tiny muted" id="pnIntH">0 = aucune douleur, 10 = douleur maximale imaginable.</p></div>
   <div class="field"><span class="lbl" id="pnOnL">Apparition</span><div class="toggles" role="radiogroup" aria-labelledby="pnOnL">${[["recente","Récente"],["habituelle","Habituelle, elle revient"]].map(([k,l])=>`<button type="button" class="toggle" role="radio" data-pnonset="${k}" aria-checked="false" aria-pressed="false">${l}</button>`).join("")}</div></div>
   ${fld("pnTrig","Mouvement qui la déclenche (facultatif)","text","",null,'placeholder="Ex. : monter les bras au-dessus de la tête"')}
   <div class="field"><span class="lbl" id="pnRestL">Gêne au repos ?</span><div class="toggles" role="radiogroup" aria-labelledby="pnRestL">${[["oui","Oui, même au repos"],["non","Non, seulement à l'effort"]].map(([k,l])=>`<button type="button" class="toggle" role="radio" data-pnrest="${k}" aria-checked="false" aria-pressed="false">${l}</button>`).join("")}</div></div>
   <div class="field"><label for="pnCom">Commentaire (facultatif)</label><textarea id="pnCom"></textarea></div>
   <div class="alert"><span class="dot"></span><div class="small">${esc(PAIN_ADVICE)}</div></div>
   <p class="small" id="pnMsg" role="alert"></p></form></div>
   <div class="sheet-actions"><button class="btn full" data-act="savePain">Enregistrer</button><button class="btn ghost full" data-act="closeSheet">Annuler</button></div>`,"Douleur")}
function savePain(){const f=document.getElementById("painForm");if(!f)return;const pick=a=>{const b=f.querySelector(`[data-${a}][aria-checked="true"]`);return b?b.dataset[a]:null};
  const zone=val("pnZone");const m=document.getElementById("pnMsg");if(!zone){m.textContent="Choisis la zone douloureuse.";document.getElementById("pnZone").focus();return}
  const intensity=+val("pnInt");const onset=pick("pnonset")||"nr";const rest=pick("pnrest");
  const id=uid("pain");const date=PAIN_SLOT&&sessionById(PAIN_SLOT)?sessionById(PAIN_SLOT).date:todayISO();
  S.pain=S.pain||{};S.pain[id]={at:nowISO(),date,zone,location:PAIN_ZL(zone),side:pick("pnside")||"nr",intensity,onset,trigger:val("pnTrig").trim()||undefined,atRest:rest==null?undefined:rest==="oui",comment:val("pnCom").trim(),slot:PAIN_SLOT||undefined};
  save();const sid=PAIN_SLOT;closeSheet(false);render();if(sid&&sessionById(sid))openSession(sid);toast("Douleur enregistrée : la proposition en tient compte");
}
document.addEventListener("click",ev=>{const t=ev.target.closest("[data-pnside],[data-pnonset],[data-pnrest]");if(!t)return;const k=Object.keys(t.dataset)[0];
  t.parentElement.querySelectorAll("[data-"+k+"]").forEach(b=>{const on=b===t;b.setAttribute("aria-checked",on);b.setAttribute("aria-pressed",on)})});
document.addEventListener("input",ev=>{if(ev.target.id==="pnInt"){const v=document.getElementById("pnIntV");if(v)v.textContent=ev.target.value}});
