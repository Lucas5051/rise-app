/* =====================================================================
   MODULE 26 · DÉROULEMENT ACTIF D'UNE SÉANCE
   Échauffement → corps de séance → retour au calme, chronométrés.
   Tout est horodaté : fermer l'appli ou recharger la page ne fait pas perdre la séance (S.active).
   ===================================================================== */
/* ---------- Fiche d'exécution (fenêtre accessible, ne touche pas au chronomètre) ---------- */
function exCues(e){return String(e.cue||"").split(/(?<=\.)\s+/).filter(Boolean).slice(0,3)}
function libMedia(name){return (PL&&PL.library&&PL.library[name])||null}
/* o = {name, ex (exercice prescrit), warm (élément d'échauffement / retour au calme)} */
function openFiche(o){
  const f=exLib(o.name,o.warm);const e=o.ex||null,w=o.warm||null;const L=e?loadInfo(e):null;
  const cues=(f.cues.length?f.cues:e?exCues(e):w&&w.cue?[w.cue]:[]).slice(0,3);
  const alt=(e&&e.alt&&e.alt!=="—"?e.alt:"")||(w&&w.alt)||(f.alt&&f.alt!=="—"?f.alt:"");
  const media=f.video?`<video src="${esc(mediaSrc(f.video))}"${mediaAttr(f.video)} autoplay loop muted playsinline controls aria-label="Vidéo d'exécution : ${esc(o.name)}"></video>`:(f.photo||f.photoFront)?`<img src="${esc(mediaSrc(f.photo||f.photoFront))}"${mediaAttr(f.photo||f.photoFront)} alt="Photo d'exécution, vue de face : ${esc(o.name)}">`:exThumb(o.name,true,w);
  const m=document.createElement("div");m.className="media-modal";const hid="fiT"+Date.now();
  m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-labelledby",hid);m._ret=document.activeElement;
  m.innerHTML=`<div class="media-box" tabindex="-1"><div class="row between" style="flex-wrap:nowrap"><h2 id="${hid}">${esc(o.name)}</h2><button class="close" data-act="closeMedia" aria-label="Fermer la fiche">✕</button></div>
   <div class="media-view">${media}</div>
   ${f.photoSide?`<img class="media-side" src="${esc(mediaSrc(f.photoSide))}"${mediaAttr(f.photoSide)} alt="Vue de profil : ${esc(o.name)}">`:""}
   ${!(f.video||f.photo||f.photoFront)?`<p class="tiny muted">La vidéo de cet exercice n'a pas encore été ajoutée. Le pictogramme et les consignes ci-dessous suffisent pour l'exécuter.</p>`:f.rights?`<p class="tiny muted">Média : ${esc(f.rights)}</p>`:""}
   <div class="row">${f.cat?`<span class="chip st-future">${esc(EX_CATS[f.cat]||f.cat)}</span>`:""}${f.equip?`<span class="chip st-future">${esc(f.equip)}</span>`:""}</div>
   ${f.muscles?`<p class="small"><b>Zones principales :</b> ${esc(f.muscles)}</p>`:""}
   ${w?`<p class="small"><b>À faire :</b> ${esc(w.dose)}</p>`:""}
   ${cues.length?`<h3>Consignes essentielles</h3><ol class="small cues">${cues.map(c=>`<li>${esc(c)}</li>`).join("")}</ol>`:""}
   ${f.errors.length?`<h3>Erreurs fréquentes</h3><ul class="clean small">${f.errors.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}
   ${alt?`<h3>Alternative</h3><p class="small">${esc(alt)}</p>`:""}
   ${e?`<p class="small muted">${e.sets} × ${esc(e.reps)} · ${esc(e.rir)} · repos ${esc(e.rest)}${L&&L.kg?" · "+esc(L.kg):""}</p>`:""}
   <button class="btn full" data-act="closeMedia" style="margin-top:12px">${document.getElementById("player")?"Revenir à la séance":"Fermer"}</button></div>`;
  document.body.appendChild(m);m.querySelector(".close").focus();try{history.pushState({fiche:1},"")}catch(e){}
}
function openMedia(ei){const a=S.active,s=sessionById(a?a.id:openId);const e=playerItems(s)[ei];if(e)openFiche({name:e.n,ex:e})}
function openWarm(key){const [ph,i]=key.split(":");const s=sessionById(S.active?S.active.id:openId);if(!s)return;const T=tpl(s);const list=(ph==="wu"?wuOf(T):coolOf(T))||{items:[]};const w=list.items[+i];if(w&&typeof w==="object")openFiche({name:w.n,warm:w})}
function closeMedia(){const mm=[...document.querySelectorAll(".media-modal")];const m=mm.pop();if(!m)return;const ret=m._ret;m.remove();syncInert();
  const f=ret&&document.contains(ret)&&!ret.closest("[inert]")?ret:(document.querySelector("#player [data-focusback]")||document.querySelector("#player button"));f&&f.focus({preventScroll:true})}

/* ---------- Lecteur ---------- */
const playerItems=s=>sessionItems(s).filter(e=>!e.removed);
const secsOf=e=>{const r=String(e.reps);let m=r.match(/^(\d+)\s*min/);if(m)return +m[1]*60;m=r.match(/^(\d+)\s*s/);if(m)return +m[1]*(r.includes("côté")?2:1);return 0};
function buildSteps(items){const steps=[];
  for(let i=0;i<items.length;i++){const e=items[i],n=typeof e.sets==="number"?e.sets:(parseInt(e.sets)||1);
    const nx=items[i+1];const pair=e.ss&&/1$/.test(e.ss)&&nx&&nx.ss&&nx.ss[0]===e.ss[0];
    if(pair){const n2=typeof nx.sets==="number"?nx.sets:(parseInt(nx.sets)||1);for(let k=1;k<=Math.max(n,n2);k++){if(k<=n)steps.push({ei:i,set:k,of:n,rest:0,pairNext:true});if(k<=n2)steps.push({ei:i+1,set:k,of:n2,rest:restSecs(nx.rest)||restSecs(e.rest)})}i++;continue}
    for(let k=1;k<=n;k++)steps.push({ei:i,set:k,of:n,rest:k<n?restSecs(e.rest):0});
  }
  return steps}
let PTICK=null,AUDIO=null;
function beep(n=1){try{if(!PL.prefs.sound&&PL.prefs.sound!==undefined)return;AUDIO=AUDIO||new (window.AudioContext||window.webkitAudioContext)();for(let i=0;i<n;i++){const o=AUDIO.createOscillator(),g=AUDIO.createGain();o.frequency.value=i%2?660:880;g.gain.value=.08;o.connect(g);g.connect(AUDIO.destination);const t=AUDIO.currentTime+i*.25;o.start(t);o.stop(t+.15)}}catch(e){}}
/* Avant le départ : appareils connus (on peut toujours continuer sans) */
function openStartFlow(id){
  const s=sessionById(id);if(!s)return;openId=id;sheetMode="start";
  const pol=POLAR.adapter&&POLAR.adapter.state==="connected";
  openSheet(`<div class="sheet-scroll">`+head(esc(tpl(s).name),"Avant de commencer")+`<div class="stack">
   <p class="small">Veux-tu connecter tes appareils ? Tu peux aussi commencer sans.</p>
   <div class="list-item" style="cursor:default"><span class="type-ic ic-muscu" aria-hidden="true">${ICONS.heart}</span><div class="grow"><b>Ceinture cardiaque Polar</b><div class="small muted">${pol?"Connectée : la fréquence cardiaque sera enregistrée.":Native.isApp()?"Non connectée":"Connexion directe disponible dans l'appli iPhone"}</div></div>${pol?`<span class="chip st-done">${ICONS.check}OK</span>`:Native.isApp()?`<button class="btn secondary small" data-act="pConnect">Connecter</button>`:""}</div>
   <div class="list-item" style="cursor:default"><span class="type-ic ic-other" aria-hidden="true">${ICONS.clock}</span><div class="grow"><b>Montre, GPS ou autre appareil</b><div class="small muted">Disponible avec l'appli iPhone (Apple Santé et services des fabricants).</div></div></div>
  </div></div><div class="sheet-actions"><button class="btn full" data-act="playerGo" data-sid="${id}" style="min-height:52px">${ICONS.play}Commencer la séance</button><button class="btn ghost full" data-act="playerGo" data-sid="${id}">Continuer sans appareil</button></div>`,"Commencer la séance");
}
function playerStart(id){
  const s=sessionById(id),T=tpl(s),now=nowMs();
  const wu=wuMin(T),cd=(coolOf(T).items.length?coolOf(T).min:0),main=Math.max(5,T.dur-wu-cd);
  S.active={id,startedAt:now,phase:wu?"wu":"main",phaseAt:now,ph:{wu:{s:wu?now:null,e:null,planned:wu*60},main:{s:wu?null:now,e:null,planned:main*60},cd:{s:null,e:null,planned:cd*60}},
    paused:false,pauseAt:null,pauses:[],steps:buildSteps(playerItems(s)),cur:0,sub:"work",subAt:now,done:{},adapt:{},estEnd:now+T.dur*60e3,devices:[],alerted:{}};
  if(POLAR.adapter&&POLAR.adapter.state==="connected"){S.active.devices.push("Polar");POLAR.adapter.startSession({mode:POLAR.offlineMode}).catch(()=>{})}
  save();
  Notify.scheduleForgot&&Notify.scheduleForgot(id,S.active.estEnd);
  closeSheet(false);beep(1);openPlayer();
}
function openPlayer(){
  let p=document.getElementById("player");if(!p){p=document.createElement("div");p.id="player";p.setAttribute("role","dialog");p.setAttribute("aria-modal","true");p.setAttribute("aria-labelledby","plTitle");p._ret=document.activeElement;document.body.appendChild(p);try{history.pushState({player:1},"")}catch(e){}}
  document.body.style.overflow="hidden";document.body.classList.add("player-open");if(S.active&&S.active.endedAt)drawRecap();else drawPlayer();clearInterval(PTICK);PTICK=setInterval(tickPlayer,500);
  const f=p.querySelector("[data-autofocus]")||p.querySelector("button");f&&f.focus({preventScroll:true});
}
function closePlayer(){clearInterval(PTICK);PTICK=null;document.querySelectorAll(".media-modal").forEach(x=>x.remove());const p=document.getElementById("player");p&&p.remove();document.body.style.overflow="";document.body.classList.remove("player-open")}
/* Temps : actif = phases chronométrées hors pauses (récupérations entre séries comprises) ; pauses = interruptions ; écoulé = début → maintenant */
const activeSecs=a=>phaseElapsed(a,"wu")+phaseElapsed(a,"main")+phaseElapsed(a,"cd");
const elapsedSecs=a=>((a.endedAt||nowMs())-a.startedAt)/1000;
const pausedMs=a=>a.pauses.reduce((x,[s,e])=>x+((e||nowMs())-s),0)+(a.paused&&a.pauseAt?0:0);
function phaseElapsed(a,ph){const P=a.ph[ph];if(!P.s)return 0;const end=P.e||nowMs();let pz=0;a.pauses.forEach(([s,e])=>{const ee=e||nowMs();const os=Math.max(s,P.s),oe=Math.min(ee,end);if(oe>os)pz+=oe-os});return Math.max(0,(end-P.s-pz)/1000)}
const mmss=x=>{x=Math.max(0,Math.round(x));return Math.floor(x/60)+":"+pad(x%60)};
function drawPlayer(){
  const a=S.active,p=document.getElementById("player");if(!a||!p)return;const s=sessionById(a.id),T=tpl(s),items=playerItems(s);
  const PH=[["wu","Échauffement"],["main","Corps de séance"],["cd","Retour au calme"]];
  let h=`<div class="pl-top"><button class="icon-btn" data-act="playerMin" aria-label="Réduire (la séance continue)">${ICONS.back}</button><div class="grow"><div class="eyebrow" id="plTitle">Séance en cours · ${esc(T.name)}</div><span class="pl-times"><b class="num" data-tick="active">${mmss(activeSecs(a))}</b> <span class="small muted">temps actif</span> <span class="small muted">· <span class="num" data-tick="elapsed">${mmss(elapsedSecs(a))}</span> écoulé</span></span></div>
   <button class="btn ${a.paused?"":"secondary"} small" data-act="playerPause" data-focusback>${a.paused?"Reprendre":"Pause"}</button></div>
   <ol class="pl-phases" aria-label="Phases">${PH.map(([k,l])=>`<li class="${a.phase===k?"on":a.ph[k].e?"ok":""}" ${a.phase===k?'aria-current="step"':""}>${a.ph[k].e?"✓ ":""}${l}</li>`).join("")}</ol>`;
  if(a.paused)h+=`<div class="pl-state st-pause" role="status"><b>PAUSE</b><span>Le chronomètre est arrêté.</span></div>`;
  if(a.phase==="wu"||a.phase==="cd"){const isWu=a.phase==="wu";const info=isWu?wuOf(T):coolOf(T);const pl=a.ph[a.phase].planned;
    h+=`<div class="pl-phase-card"><div class="row between"><h2>${isWu?"Échauffement":"Retour au calme"}</h2><span class="small muted">prévu ${Math.round(pl/60)} min</span></div>
     <div class="pl-clock"><b class="num" data-tick="phase">${mmss(phaseElapsed(a,a.phase))}</b><span class="small"> écoulé</span></div>
     <div class="pl-over" data-tick="over" ${phaseElapsed(a,a.phase)>=pl?"":"hidden"} role="status">Temps ${isWu?"d'échauffement":"de retour au calme"} écoulé.</div>
     ${info&&info.items.length?warmList(info.items,a.phase):`<p class="small muted">Aucun exercice prévu pour cette phase.</p>`}<p class="tiny muted">Touche un exercice pour voir sa fiche : le chronomètre continue.</p></div>
     <div class="pl-actions">${isWu?`<button class="btn full big" data-act="playerNextPhase" data-autofocus>Passer au corps de séance</button>`:`<button class="btn full big" data-act="playerFinish" data-autofocus>Terminer la séance</button>`}</div>`;
  }else{
    const st=a.steps[a.cur];
    if(!st){h+=`<div class="pl-phase-card"><h2>Corps de séance terminé</h2><p class="small">Toutes les séries sont faites.</p></div><div class="pl-actions"><button class="btn full big" data-act="playerNextPhase" data-autofocus>Passer au retour au calme</button></div>`}
    else{const e=items[st.ei],L=loadInfo(e),tm=secsOf(e),ad=a.adapt[st.ei];const nxt=a.steps[a.cur+1];const ne=nxt?items[nxt.ei]:null;
      const sub=a.sub,lbl=sub==="rest"?"REPOS":sub==="trans"?"TRANSITION":"TRAVAIL";
      const restLeft=(a.subDur||0)-((nowMs()-a.subAt)/1000);
      h+=`<div class="pl-state st-${sub}" role="status" aria-live="assertive"><b>${lbl}</b><span>${sub==="rest"?"Récupère avant la série suivante":sub==="trans"?"Prépare l'exercice suivant":tm?"Effort chronométré":"Fais ta série, puis valide-la"}</span>${sub!=="work"||tm?`<b class="num pl-count" data-tick="sub">${mmss(sub==="work"&&tm?tm-(nowMs()-a.subAt)/1000:restLeft)}</b>`:""}</div>
       <div class="pl-ex"><div class="row" style="gap:12px;align-items:center;flex-wrap:nowrap">${exThumb(e.n)}<div class="grow"><span class="eyebrow">Exercice ${st.ei+1}/${items.length}${e.ss?" · enchaînement "+e.ss:""}</span><h2>${esc(e.n)}</h2></div><button class="btn ghost small" data-media="${st.ei}" aria-label="Voir l'exécution de ${esc(e.n)}">Exécution</button></div>
       ${ad?`<p class="small pl-adapt">${ICONS.pencil} Adapté : ${esc(ad.label)}</p>`:""}
       <div class="pl-grid"><div><small>Série</small><b class="num">${st.set}/${st.of}</b></div><div><small>Répétitions</small><b class="num">${esc(e.reps)}</b></div><div><small>Charge</small><b class="num">${L&&L.kg?esc(L.kg):L?esc(L.note):"—"}</b></div><div><small>Repos</small><b>${esc(e.rest)}</b></div></div>
       ${sub==="work"&&!tm?`<div class="grid2 pl-inputs">${fld("plReps","Reps réalisées","number",parseInt(e.reps)||"","1")}${fld("plKg","Charge réalisée (kg)","number",L&&L.kgNum?L.kgNum:"","0.5")}</div>`:""}
       <p class="small muted">${esc(e.rir)}${e.tempo?" · tempo "+esc(e.tempo):""}</p></div>
       <div class="pl-actions">${sub==="work"?(tm?`<button class="btn full big" data-act="playerSetDone">Terminer l'effort maintenant</button>`:`<button class="btn full big" data-act="playerSetDone" data-autofocus>Série terminée</button>`):`<button class="btn full big" data-act="playerSkip" data-autofocus>${sub==="rest"?"Passer le repos":"Commencer l'exercice"}</button>`}
        <div class="grid2"><button class="btn secondary" data-act="playerAdapt">Adapter l'exercice</button><button class="btn secondary" data-act="playerNextEx">Exercice suivant</button></div>
        ${ne?`<p class="small muted pl-next">Ensuite : <b>${esc(ne.n)}</b> · série ${nxt.set}/${nxt.of}</p>`:`<p class="small muted pl-next">Dernière série du corps de séance.</p>`}
        <button class="btn ghost full" data-act="playerNextPhase">Passer au retour au calme</button></div>`;
    }
  }
  p.innerHTML=`<div class="pl-wrap">${h}</div>`;
}
function tickPlayer(){
  const a=S.active;const p=document.getElementById("player");if(!a||!p){clearInterval(PTICK);return}
  if(a.paused){const el1=p.querySelector('[data-tick="elapsed"]');if(el1)el1.textContent=mmss(elapsedSecs(a));return}
  const act=p.querySelector('[data-tick="active"]');if(act)act.textContent=mmss(activeSecs(a));const el0=p.querySelector('[data-tick="elapsed"]');if(el0)el0.textContent=mmss(elapsedSecs(a));
  if(a.phase!=="main"){const el=phaseElapsed(a,a.phase);const ph=p.querySelector('[data-tick="phase"]');if(ph)ph.textContent=mmss(el);
    if(el>=a.ph[a.phase].planned&&!a.alerted[a.phase]){a.alerted[a.phase]=true;save();const o=p.querySelector('[data-tick="over"]');if(o)o.hidden=false;Native.haptic("heavy");beep(2)}return}
  const st=a.steps[a.cur];if(!st)return;const e=playerItems(sessionById(a.id))[st.ei];const tm=secsOf(e);
  const subEl=p.querySelector('[data-tick="sub"]');
  if(a.sub==="work"&&tm){const left=tm-(nowMs()-a.subAt)/1000;if(subEl)subEl.textContent=mmss(left);if(left<=0)playerSetDone(true);return}
  if(a.sub==="rest"||a.sub==="trans"){const left=a.subDur-(nowMs()-a.subAt)/1000;if(subEl)subEl.textContent=mmss(left);if(left<=0){a.sub="work";a.subAt=nowMs();save();Native.haptic("medium");beep(a.sub==="work"?2:1);drawPlayer()}}
}
function playerSetDone(auto){
  const a=S.active,s=sessionById(a.id),items=playerItems(s),st=a.steps[a.cur];if(!st)return;const e=items[st.ei];
  const reps=num(val("plReps"),0,100),kg=num(val("plKg"),0,500);
  a.done[st.ei+"-"+st.set]={reps:reps===""?(parseInt(e.reps)||null):reps,kg:kg===""?null:kg,at:nowISO(),timed:!!secsOf(e)};
  const nx=a.steps[a.cur+1];a.cur++;
  if(!nx){a.sub="work";a.subAt=nowMs();save();beep(1);drawPlayer();return}
  const changeEx=nx.ei!==st.ei;const r=st.rest||(changeEx&&!st.pairNext?45:0);
  if(r>0){a.sub=changeEx&&!st.rest?"trans":"rest";a.subDur=r;a.subAt=nowMs()}else{a.sub="work";a.subAt=nowMs()}
  save();Native.haptic(auto?"medium":"light");if(auto)beep(1);drawPlayer();
}
function playerSkip(){const a=S.active;a.sub="work";a.subAt=nowMs();save();drawPlayer()}
function playerNextEx(){const a=S.active,st=a.steps[a.cur];if(!st)return;let i=a.cur;while(a.steps[i]&&a.steps[i].ei===st.ei)i++;
  for(let k=a.cur;k<i;k++){const x=a.steps[k];if(!a.done[x.ei+"-"+x.set])a.done[x.ei+"-"+x.set]={skipped:true,at:nowISO()}}
  a.cur=i;a.sub="work";a.subAt=nowMs();save();drawPlayer()}
function playerPause(){const a=S.active;if(a.paused){const last=a.pauses[a.pauses.length-1];if(last&&!last[1])last[1]=nowMs();a.paused=false;
    if(a.sub!=="work"||secsOf(playerItems(sessionById(a.id))[(a.steps[a.cur]||{}).ei]||{})){a.subAt+=nowMs()-a.pauseAt}a.pauseAt=null}
  else{a.paused=true;a.pauseAt=nowMs();a.pauses.push([nowMs(),null])}
  save();drawPlayer()}
function playerNextPhase(){const a=S.active,now=nowMs();
  if(a.phase==="wu"){a.ph.wu.e=now;a.phase="main";a.ph.main.s=now;a.sub="work";a.subAt=now}
  else if(a.phase==="main"){a.ph.main.e=now;a.phase="cd";a.ph.cd.s=now}
  save();beep(1);drawPlayer()}
function playerAdaptMenu(){const a=S.active,st=a.steps[a.cur];if(!st)return;const e=playerItems(sessionById(a.id))[st.ei];
  const p=document.getElementById("player");const box=document.createElement("div");box.className="media-modal";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-label","Adapter l'exercice");
  box.innerHTML=`<div class="media-box"><div class="row between"><h2>Adapter : ${esc(e.n)}</h2><button class="close" data-act="closeMedia" aria-label="Fermer">✕</button></div><p class="small muted">Le chronomètre continue. L'adaptation sera indiquée dans le récapitulatif et transmise à ton coach.</p>
   <div class="stack tight" style="margin-top:10px">${[["lighter","Charge allégée (−10 %)"],["fewer","Une série de moins"],["alt","Variante sans le matériel"+(e.alt&&e.alt!=="—"?" : "+e.alt:"")],["skip","Exercice retiré (douleur, matériel…)"]].map(([k,l])=>`<button class="list-item" data-padapt="${k}"><div class="grow"><b>${esc(l)}</b></div></button>`).join("")}</div></div>`;
  document.body.appendChild(box);box.querySelector(".close").focus()}
function playerAdapt(kind){const a=S.active,st=a.steps[a.cur];if(!st)return;const ei=st.ei,e=playerItems(sessionById(a.id))[ei];
  const lbl={lighter:"charge allégée (−10 %)",fewer:"une série de moins",alt:"variante : "+(e.alt||""),skip:"exercice retiré"}[kind];
  a.adapt[ei]={kind,label:lbl,at:nowISO()};
  if(kind==="fewer"){const last=[...a.steps].map((x,i)=>({x,i})).filter(o=>o.x.ei===ei).pop();if(last&&last.i>=a.cur&&a.steps.filter(x=>x.ei===ei).length>1)a.steps.splice(last.i,1)}
  if(kind==="skip")playerNextEx();
  save();closeMedia();drawPlayer();toast("Exercice adapté")}
/* ---------- Fin de séance : récapitulatif ---------- */
function playerFinish(){const a=S.active,now=nowMs();if(a.phase==="cd")a.ph.cd.e=now;else{a.ph[a.phase].e=now}if(a.paused)playerPause();a.endedAt=now;save();drawRecap()}
function recapData(a){
  const s=sessionById(a.id),items=playerItems(s);let ton=0,setsDone=0,exDone=new Set();
  Object.entries(a.done).forEach(([k,v])=>{if(v.skipped)return;setsDone++;exDone.add(+k.split("-")[0]);if(isNum(v.kg)&&isNum(v.reps))ton+=v.kg*v.reps});
  const ph=k=>Math.round(phaseElapsed(a,k));const pz=Math.round(pausedMs(a)/1000);
  const wu=ph("wu"),main=ph("main"),cd=ph("cd");
  return{items,ton:Math.round(ton),setsDone,exDone:exDone.size,adapted:Object.keys(a.adapt).length,wu,main,cd,pause:pz,active:wu+main+cd,total:Math.round(elapsedSecs(a))}}
function drawRecap(){
  const a=S.active,p=document.getElementById("player");if(!a||!p)return;const r=recapData(a),s=sessionById(a.id);
  const adapted=r.adapted>0||isAdapted(s);
  p.innerHTML=`<div class="pl-wrap"><div class="pl-top"><div class="grow"><div class="eyebrow">${esc(tpl(s).name)}</div><h1 id="plTitle">Récapitulatif</h1></div></div>
   <div class="kpis recap"><div><small>Échauffement actif</small><b class="num">${mmss(r.wu)}</b></div><div><small>Corps de séance actif</small><b class="num">${mmss(r.main)}</b></div><div><small>Retour au calme actif</small><b class="num">${mmss(r.cd)}</b></div><div><small>Pauses</small><b class="num">${mmss(r.pause)}</b></div><div class="kp-strong"><small>Temps actif cumulé</small><b class="num">${mmss(r.active)}</b></div><div><small>Temps total écoulé</small><b class="num">${mmss(r.total)}</b></div></div>
   <p class="small">${r.exDone}/${r.items.length} exercices · ${r.setsDone} séries${r.adapted?" · "+r.adapted+" exercice"+(r.adapted>1?"s":"")+" adapté"+(r.adapted>1?"s":""):""}${r.ton?" · tonnage "+r.ton+" kg":""}.</p>
   <p class="tiny muted">La charge (sRPE = RPE × durée) utilise le temps actif cumulé : temps total de la séance, récupérations entre séries comprises (Foster, cours Quantification de la charge p. 10), sans les pauses où tu as arrêté le chronomètre.</p>
   ${a.devices.length?`<p class="small">Appareils : ${esc(a.devices.join(", "))} (fréquence cardiaque associée à la séance).</p>`:`<p class="small muted">Aucun appareil connecté pendant la séance.</p>`}
   <fieldset class="card stack"><legend class="sr-only">Statut de la séance</legend><h3>Comment s'est passée la séance ?</h3>
    <div class="seg" role="radiogroup" aria-label="Statut">${[["done","Réalisée"],["adapted","Réalisée avec adaptation"]].map(([k,l])=>`<button role="radio" aria-checked="${(adapted?"adapted":"done")===k}" data-recst="${k}">${l}</button>`).join("")}</div>
    <div id="recAdapt" ${adapted?"":"hidden"} class="stack tight">${reasonPicker("rec",ADAPT_REASONS,"")}<div class="field"><label for="recCom">Commentaire (obligatoire) : qu'as-tu adapté ?</label><textarea id="recCom" placeholder="Ex. : charge baissée au squat, genou sensible"></textarea></div></div>
   </fieldset>
   <div class="pl-actions"><button class="btn full big" data-act="recValidate" data-autofocus>Valider la séance</button><button class="btn ghost full" data-act="recResume">Reprendre la séance</button></div></div>`;
  p.querySelector("[data-autofocus]").focus({preventScroll:true});
}
function reasonPicker(pref,list,cur){return `<div class="field"><span class="lbl" id="${pref}RL">Raison</span><div class="toggles" role="radiogroup" aria-labelledby="${pref}RL">${list.map(([k,l])=>`<button type="button" class="toggle" role="radio" data-reason="${pref}:${k}" aria-checked="${cur===k}" aria-pressed="${cur===k}">${l}</button>`).join("")}</div><input type="hidden" id="${pref}Reason" value="${esc(cur||"")}"><div class="field" id="${pref}OtherW" ${cur==="autre"?"":"hidden"}><label for="${pref}Other">Précise</label><input id="${pref}Other"></div></div>`}
function recValidate(){
  const a=S.active,s=sessionById(a.id),r=recapData(a);const st=(document.querySelector('[data-recst][aria-checked="true"]')||{}).dataset;const kind=st&&st.recst||"done";
  let reason=null,comment="";
  if(kind==="adapted"){reason=val("recReason");comment=(val("recCom")||"").trim();if(!reason){toast("Choisis une raison");return}if(reason==="autre"&&!val("recOther").trim()){toast("Précise la raison");return}if(!comment){toast("Le commentaire est obligatoire pour une séance adaptée");document.getElementById("recCom").focus();return}}
  const prev=S.status[a.id]?{...S.status[a.id]}:null;
  S.status[a.id]={s:kind,at:nowISO(),...(reason?{reason,reasonOther:reason==="autre"?val("recOther").trim():"",comment}:{})};
  const l=S.log[a.id]||{};const end=a.endedAt||nowMs();
  S.log[a.id]={...l,dur:Math.max(1,Math.round(r.active/60)),durSrc:"chronomètre (temps actif)",endAt:end,rpeDue:end+30*60e3,ton:r.ton||tonnage(sessionItems(s)),phases:{wu:r.wu,main:r.main,cd:r.cd,pause:r.pause,active:r.active,total:r.total},sets:a.done,adaptEx:a.adapt,devices:a.devices,startedAt:a.startedAt,durPending:false};
  if(a.devices.includes("Polar")&&POLAR.adapter&&POLAR.adapter.state==="recording")polarStop();
  Notify.cancelForgot&&Notify.cancelForgot(a.id);S.active=null;const ok=save();try{celebrateVolume(s.date)}catch(e){}
  closePlayer();render();showDone(s,kind==="adapted",ok,null,prev);
}
/* ---------- Validation sans le lecteur (séance faite hors appli) ----------
   Jamais de durée théorique enregistrée comme durée réelle : durée saisie, heures de début et de fin, ou « durée à confirmer ».
   « Réalisée avec adaptation » exige toujours une raison et un commentaire. */
function durBlock(p,l={}){const mode=isNum(l.dur)&&!l.durPending?"dur":"";return `<fieldset class="field dur-block"><legend class="lbl">Durée réelle de la séance</legend>
  <div class="seg seg3" role="radiogroup" aria-label="Comment indiquer la durée">${[["dur","Durée"],["times","Début et fin"],["unknown","Je ne sais plus"]].map(([k,t])=>`<button type="button" role="radio" data-durmode="${p}:${k}" aria-checked="${mode===k}">${t}</button>`).join("")}</div>
  <input type="hidden" id="${p}DurMode" value="${mode}">
  <div id="${p}DurW" ${mode==="dur"?"":"hidden"}>${fld(p+"Dur","Durée en minutes","number",mode==="dur"?l.dur:"","1",'min="1" max="300"')}</div>
  <div id="${p}TimesW" class="grid2" hidden>${fld(p+"Start","Heure de début","time","")}${fld(p+"End","Heure de fin","time","")}</div>
  <p id="${p}UnkW" class="small muted" hidden>La séance sera enregistrée avec le statut « Durée à confirmer ». Tu pourras la compléter plus tard dans Suivi.</p></fieldset>`}
function readDur(p){const m=val(p+"DurMode");
  if(m==="dur"){const d=num(val(p+"Dur"),1,300);return d===""?{err:"Indique la durée en minutes (1 à 300)."}:{dur:d,src:"saisie"}}
  if(m==="times"){const a=val(p+"Start"),b=val(p+"End");if(!a||!b)return{err:"Indique l'heure de début et l'heure de fin."};const [h1,m1]=a.split(":").map(Number),[h2,m2]=b.split(":").map(Number);let d=(h2*60+m2)-(h1*60+m1);if(d<=0)d+=1440;if(d>300)return{err:"Durée calculée supérieure à 5 h : vérifie les heures."};return{dur:d,src:"heures "+a+" → "+b,start:a,end:b}}
  if(m==="unknown")return{dur:null,pending:true,src:"inconnue"};
  return{err:"Choisis comment indiquer la durée."}}
function rpeChoice(p){return `<fieldset class="field"><legend class="lbl">RPE de séance</legend><div class="seg" role="radiogroup" aria-label="Quand noter le RPE">${[["now","Maintenant"],["later","Plus tard (rappel 30 min)"]].map(([k,t])=>`<button type="button" role="radio" data-rpemode="${p}:${k}" aria-checked="${k==="later"}">${t}</button>`).join("")}</div><input type="hidden" id="${p}RpeMode" value="later"><div id="${p}RpeW" hidden>${rpePicker(p,null)}</div></fieldset>`}
function openManualDone(id,kind){const s=sessionById(id);if(!s)return;if(s.date>todayISO()){toast("Séance prévue le "+fmtShort(s.date)+" : tu pourras la valider ce jour-là.");return}
  openId=id;sheetMode="manual";const l=S.log[id]||{};
  const k=kind||(isAdapted(s)?"adapted":"done");
  openSheet(`<div class="sheet-scroll">`+head(esc(tpl(s).name)+" · "+fmtShort(s.date),"Séance réalisée")+`<div class="stack">
   <p class="small muted">Séance faite sans le chronomètre de l'appli : la durée prévue (${tpl(s).dur} min) n'est jamais utilisée comme durée réelle.</p>
   <div class="seg" role="radiogroup" aria-label="Statut">${[["done","Réalisée"],["adapted","Réalisée avec adaptation"]].map(([x,t])=>`<button type="button" role="radio" data-mdst="${x}" aria-checked="${k===x}">${t}</button>`).join("")}</div>
   <div id="mdAdapt" class="stack tight" ${k==="adapted"?"":"hidden"}>${reasonPicker("md",ADAPT_REASONS,"")}<div class="field"><label for="mdCom">Commentaire (obligatoire) : qu'as-tu adapté ?</label><textarea id="mdCom"></textarea></div></div>
   ${durBlock("md",l)}${rpeChoice("md")}
   <p class="small" id="mdMsg" role="alert"></p></div></div>
   <div class="sheet-actions"><button class="btn full" data-act="saveManualDone" style="min-height:52px">${ICONS.check}Enregistrer la séance</button></div>`,"Séance réalisée")}
function saveManualDone(){const id=openId,s=sessionById(id);const msg=document.getElementById("mdMsg");const fail=t=>{msg.textContent=t;return};
  const kind=(document.querySelector('[data-mdst][aria-checked="true"]')||{dataset:{mdst:"done"}}).dataset.mdst;
  let reason=null,comment="";
  if(kind==="adapted"){reason=val("mdReason");comment=(val("mdCom")||"").trim();if(!reason)return fail("Choisis la raison de l'adaptation.");if(reason==="autre"&&!val("mdOther").trim())return fail("Précise la raison.");if(!comment)return fail("Le commentaire est obligatoire pour une séance adaptée.")}
  const d=readDur("md");if(d.err)return fail(d.err);
  const rm=val("mdRpeMode");const rpe=rm==="now"?num(val("mdRpe"),0,10):"";if(rm==="now"&&rpe==="")return fail("Choisis ton RPE ou « Plus tard ».");
  const prev=S.status[id]?{...S.status[id]}:null;const end=nowMs();
  S.status[id]={s:kind,at:nowISO(),src:"manuel",...(reason?{reason,reasonOther:reason==="autre"?val("mdOther").trim():"",comment}:{})};
  const l=S.log[id]||{};
  S.log[id]={...l,dur:d.dur,durPending:!!d.pending,durSrc:d.src,manual:true,endAt:end,ton:tonnage(sessionItems(s)),
    rpe:rpe===""?(l.rpe??""):rpe,rpeAt:rpe!==""?nowISO():(l.rpeAt||null),rpeDue:rpe===""?end+30*60e3:null};
  if(rpe==="")Notify.scheduleRpe("rpe-"+id,end+30*60e3,tpl(s).name);
  const ok=save();try{celebrateVolume(s.date)}catch(e){}
  closeSheet(false);render();showDone(s,kind==="adapted",ok,null,prev,rpe!=="");
}
/* Non réalisée : raison obligatoire (liste), commentaire facultatif */
function openStatusForm(id,kind){if(kind==="adapted"){openManualDone(id,"adapted");return}
  openId=id;sheetMode="status";const s=sessionById(id);const cur=S.status[id]||{};
  openSheet(`<div class="sheet-scroll">`+head(esc(tpl(s).name)+" · "+fmtShort(s.date),"Non réalisée")+`<div class="stack">
   ${reasonPicker("st",MISS_REASONS,cur.s==="missed"?cur.reason:"")}
   <div class="field"><label for="stCom">Commentaire (facultatif)</label><textarea id="stCom">${esc(cur.s==="missed"?cur.comment||"":"")}</textarea></div>
  </div></div><div class="sheet-actions"><button class="btn full" data-act="saveStatus" data-kind="missed" style="min-height:52px">Enregistrer</button></div>`,"Statut de la séance")}
function saveStatus(kind){if(kind!=="missed")return;
  const id=openId;const reason=val("stReason"),comment=(val("stCom")||"").trim();
  if(!reason){toast("Choisis une raison");return}
  if(reason==="autre"&&!val("stOther").trim()){toast("Précise la raison");return}
  S.status[id]={s:"missed",at:nowISO(),reason,reasonOther:reason==="autre"?val("stOther").trim():"",comment};
  save();closeSheet(false);render();toast("Noté : séance non réalisée ("+reasonLabel(reason).toLowerCase()+")");
}
/* ---------- Oubli de terminer ---------- */
const FORGOT_MARGIN=30*60e3;
function checkForgotten(){
  const a=S.active;if(!a||document.getElementById("player")||DLG)return;
  if(nowMs()<a.estEnd+FORGOT_MARGIN){return}
  if(a.snoozeUntil&&nowMs()<a.snoozeUntil)return;
  openForgot();
}
function openForgot(){const a=S.active,s=sessionById(a.id);sheetMode="forgot";const d=new Date(a.estEnd);
  openSheet(`<div class="sheet-scroll">`+head(esc(tpl(s).name),"As-tu terminé ta séance ?")+`<div class="stack">
   <p class="small">Ta séance a commencé à ${hhmm(a.startedAt)} et devait finir vers ${hhmm(a.estEnd)}, mais tu n'as pas appuyé sur « Terminer ». L'appli n'invente aucune durée : indique l'heure de fin approximative.</p>
   <div class="field"><label for="fgEnd">Heure de fin approximative</label><input id="fgEnd" type="time" value="${pad(d.getHours())}:${pad(d.getMinutes())}"></div>
  </div></div><div class="sheet-actions"><button class="btn full" data-act="forgotSave">Enregistrer cette heure de fin</button><button class="btn secondary full" data-act="forgotUnknown">Je ne sais plus (durée à confirmer)</button><button class="btn ghost full" data-act="forgotContinue">Je suis encore en séance</button></div>`,"Séance non terminée")}
function forgotFinalize(endMs,pending){
  const a=S.active,s=sessionById(a.id);const prev=S.status[a.id]?{...S.status[a.id]}:null;
  S.status[a.id]={s:Object.keys(a.adapt).length?"adapted":"done",at:nowISO(),...(Object.keys(a.adapt).length?{reason:"autre",reasonOther:"adaptations pendant la séance",comment:Object.values(a.adapt).map(x=>x.label).join(", ")}:{})};
  const l=S.log[a.id]||{};
  S.log[a.id]={...l,dur:pending?null:Math.max(1,Math.round((endMs-a.startedAt-pausedMs(a))/60e3)),durPending:!!pending,endAt:pending?null:endMs,rpeDue:(endMs||nowMs())+30*60e3,sets:a.done,adaptEx:a.adapt,startedAt:a.startedAt,forgot:true,ton:tonnage(sessionItems(s))};
  S.active=null;save();closeSheet(false);render();toast(pending?"Séance enregistrée : durée à confirmer":"Séance enregistrée avec l'heure de fin indiquée");
}
function openDurFix(id){openId=id;sheetMode="durfix";const s=sessionById(id),l=S.log[id]||{};const st=l.startedAt?new Date(l.startedAt):null;
  openSheet(`<div class="sheet-scroll">`+head(esc(tpl(s).name)+" · "+fmtShort(s.date),"Durée à confirmer")+`<div class="stack">
   <p class="small">${st?"Début enregistré à "+hhmm(l.startedAt)+". ":""}Indique l'heure de fin approximative ou la durée.</p>
   <div class="grid2">${st?`<div class="field"><label for="dfEnd">Heure de fin</label><input id="dfEnd" type="time"></div>`:""}${fld("dfDur","ou durée (min)","number","","1")}</div>
  </div></div><div class="sheet-actions"><button class="btn full" data-act="durFixSave">Enregistrer</button></div>`,"Durée à confirmer")}
function durFixSave(){const id=openId,l=S.log[id]||{};let d=num(val("dfDur"),1,300);
  const e=val("dfEnd");if(d===""&&e&&l.startedAt){const st=new Date(l.startedAt);const [h,m]=e.split(":").map(Number);const end=new Date(st);end.setHours(h,m,0,0);if(end<st)end.setDate(end.getDate()+1);d=Math.max(1,Math.round((end-st)/60e3))}
  if(d===""){toast("Indique une heure de fin ou une durée");return}
  S.log[id]={...l,dur:d,durPending:false,durHist:[...(l.durHist||[]),{old:l.dur??null,nw:d,at:nowISO(),by:"athlète",reason:"heure de fin confirmée"}]};save();closeSheet(false);render();toast("Durée enregistrée : "+d+" min")}

