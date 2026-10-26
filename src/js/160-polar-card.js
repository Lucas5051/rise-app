/* =====================================================================
   MODULE 16 · CARTE CEINTURE POLAR
   ===================================================================== */
function polarMiniInner(){
  const a=POLAR.adapter;if(!a)return "";
  const st=a.state;const pill=st==="recording"||st==="connected"?"on":st==="lost"||st==="error"?"bad":st==="manual"?"":"warn";
  return `<div class="row between"><h3>Ceinture Polar</h3><span class="state-pill ${pill}">${esc(POLAR_LABEL[st]||st)}</span></div>
   <p class="small muted" style="margin-top:6px">${a.kind==="manual"?"Connexion directe disponible dans la version iPhone de l'application. Tu peux actuellement saisir ou importer le résumé Polar.":a.kind==="simulation"?"Simulation active : données fictives, aucune ceinture réelle n'est connectée.":(a.device?esc(a.device.name)+(a.battery!=null?" · batterie "+a.battery+" %":""):"Ceinture non connectée.")}</p>
   ${st==="recording"&&S.active?`<button class="btn ghost small full" data-start="${S.active.id}" style="margin-top:8px">Voir la séance en cours</button>`:""}`;
}
function liveStats(a){
  const r=a.rec;const hm=+S.settings.hrMax;
  const cur=a.lastAt&&nowMs()-a.lastAt<5000?a.lastHr:null;
  if(!r)return{cur,avg:null,max:null,dur:0,zones:null,zone:cur&&hm?zoneOf(cur,hm):null};
  const v=r.samples.map(x=>x[1]);const dur=Math.round((((r.pauseAt||nowMs())-r.start-r.pausedMs))/1000);
  const zones=hm?[0,0,0,0,0]:null;if(zones)r.samples.forEach(x=>{const z=zoneOf(x[1],hm);if(z>=0)zones[z]++});
  return{cur,avg:v.length?Math.round(v.reduce((p,q)=>p+q,0)/v.length):null,max:v.length?Math.max(...v):null,dur,zones,zone:cur&&hm?zoneOf(cur,hm):null};
}
function polarCardInner(){
  const a=POLAR.adapter;if(!a)return "";const st=a.state;const sim=a.kind==="simulation";const L=liveStats(a);
  const pill=st==="recording"||st==="connected"?"on":st==="lost"||st==="error"?"bad":st==="manual"?"":"warn";
  let h=`<div class="row between"><h3>Ceinture Polar</h3><span class="state-pill ${pill}" id="pState">${esc(POLAR_LABEL[st]||st)}</span></div>`;
  if(sim)h+=`<p style="margin-top:8px"><span class="sim-badge">Simulation · données fictives</span></p>`;
  if(a.kind==="manual"){
    h+=`<p class="small" style="margin-top:8px">Connexion directe disponible dans la version iPhone de l'application. Tu peux actuellement saisir ou importer le résumé Polar.</p><p class="tiny muted" style="margin-top:6px">Safari sur iPhone ne permet pas le Bluetooth depuis une page web : la connexion en direct passe par l'application iPhone (passerelle native livrée avec cette version).</p>`;
  }else{
    if(a.device)h+=`<p class="small muted" style="margin-top:6px">${esc(a.device.name)}${a.battery!=null?" · batterie "+a.battery+" %":" · batterie non disponible"}</p>`;
    if(["connected","recording","paused","lost"].includes(st)||a.rec){
      h+=`<div class="hr-big" style="margin-top:10px"><b class="num" id="pBpm">${L.cur??"—"}</b><span class="muted">bpm${L.zone!=null&&L.zone>=0?" · zone "+(L.zone+1):""}</span></div>
       <div class="hr-stats" style="margin-top:8px"><div><small>Moyenne</small><b class="num" id="pAvg">${L.avg??"—"}</b></div><div><small>Maximum</small><b class="num" id="pMax">${L.max??"—"}</b></div><div><small>Durée</small><b class="num" id="pDur">${Math.floor(L.dur/60)}:${pad(L.dur%60)}</b></div></div>`;
      if(L.zones)h+=`<div class="zones" id="pZones" style="margin-top:8px">${L.zones.map((z,i)=>`<div class="zr"><span>Z${i+1}</span><span class="zb"><i style="width:${L.dur?Math.min(100,Math.round(z/Math.max(1,L.dur)*100)):0}%"></i></span><span class="num">${Math.floor(z/60)}:${pad(z%60)}</span></div>`).join("")}</div>`;
      else if(a.rec)h+=`<p class="tiny muted" style="margin-top:6px">Mode sans zones : renseigne une FC max mesurée dans Programme pour afficher les zones.</p>`;
    }
    if(st==="lost")h+=`<div class="alert pain" style="margin-top:10px"><span class="dot"></span><div>Connexion perdue. ${a.rec?"La séance en cours est conservée : reconnecte la ceinture pour continuer.":""}</div></div>`;
    if(POLAR.error)h+=`<div class="alert pain" style="margin-top:10px"><span class="dot"></span><div>${esc(POLAR.error)}</div></div>`;
    if(st==="scanning"||POLAR.devices.length&&st==="disconnected")h+=`<div class="stack tight" style="margin-top:10px">${POLAR.devices.map(d=>`<button class="date-pick" data-pconnect="${esc(d.id)}"><span class="grow"><b>${esc(d.name||d.id)}</b></span><span class="small muted">Connecter</span></button>`).join("")||'<p class="small muted">Recherche en cours…</p>'}</div>`;
    if(st==="connected"&&a.caps.offlineRecording)h+=`<fieldset class="stack tight" style="border:0;padding:0;margin:10px 0 0"><legend class="small" style="font-weight:650">Mode d'enregistrement</legend><label class="row small"><input type="radio" name="pmode" value="live" ${POLAR.offlineMode==="live"?"checked":""}> En direct avec l'iPhone à proximité</label><label class="row small"><input type="radio" name="pmode" value="device" ${POLAR.offlineMode==="device"?"checked":""}> Enregistrer dans la ceinture et synchroniser après</label></fieldset>`;
    h+=`<div class="grid2" style="margin-top:12px">`;
    if(st==="disconnected")h+=`<button class="btn small" data-act="pConnect" style="grid-column:1/-1">Connecter ma ceinture</button>`;
    if(st==="connected")h+=`<button class="btn small" data-act="pStart">Démarrer la séance</button><button class="btn ghost small" data-act="pDisconnect">Déconnecter</button>`;
    if(st==="connected"&&a.caps.offlineRecording)h+=`<button class="btn ghost small" data-act="pSync" style="grid-column:1/-1">Récupérer les séances de la ceinture</button>`;
    if(st==="recording")h+=`<button class="btn secondary small" data-act="pPause">Pause</button><button class="btn small" data-act="pStop">Terminer et enregistrer</button>`;
    if(st==="paused")h+=`<button class="btn secondary small" data-act="pResume">Reprendre</button><button class="btn small" data-act="pStop">Terminer et enregistrer</button>`;
    if(st==="lost")h+=`<button class="btn small" data-act="pReconnect">Reconnecter</button>${a.rec?'<button class="btn ghost small" data-act="pStop">Terminer et enregistrer</button>':""}`;
    if(st==="error")h+=`<button class="btn small" data-act="pConnect" style="grid-column:1/-1">Réessayer</button>`;
    if(sim&&(st==="recording"||st==="connected"))h+=`<button class="btn ghost small" data-act="pSimLoss" style="grid-column:1/-1">Simuler une perte de connexion</button>`;
    h+=`</div>`;
  }
  if(!(new NativePolarAdapter().isAvailable()))h+=`<label class="row small" style="margin-top:12px;min-height:44px"><input type="checkbox" id="mockToggle" ${S.settings.mock?"checked":""} style="width:22px;height:22px"> Tester l'interface avec un capteur simulé (données fictives)</label>`;
  return h;
}
let lastPolarState=null;
function updatePolarUI(fast){
  const a=POLAR.adapter;if(!a)return;
  const mini=document.getElementById("polarMini");if(mini&&!fast)mini.innerHTML=polarMiniInner();
  const el=document.getElementById("polarCard");if(!el)return;
  if(fast&&lastPolarState===a.state&&document.getElementById("pBpm")){
    const L=liveStats(a);const set=(id,v)=>{const x=document.getElementById(id);if(x)x.textContent=v};
    set("pBpm",L.cur??"—");set("pAvg",L.avg??"—");set("pMax",L.max??"—");set("pDur",Math.floor(L.dur/60)+":"+pad(L.dur%60));
    const zb=document.getElementById("pZones");if(zb&&L.zones)zb.querySelectorAll(".zr").forEach((r,i)=>{r.querySelector("i").style.width=(L.dur?Math.min(100,Math.round(L.zones[i]/Math.max(1,L.dur)*100)):0)+"%";r.lastElementChild.textContent=Math.floor(L.zones[i]/60)+":"+pad(L.zones[i]%60)});
    return;
  }
  lastPolarState=a.state;el.innerHTML=polarCardInner();
}
function openConsent(){
  openSheet(`<div class="sheet-scroll">${head("Avant de connecter","Tes données cardiaques")}<div class="stack small">
   <p>La fréquence cardiaque, les intervalles RR et la batterie de la ceinture sont des données personnelles.</p>
   <ul class="clean"><li>Elles sont enregistrées sur cet appareil${STORE.mode==="claude"?" et copiées sur ton compte Claude":""}.</li><li>Elles servent uniquement à calculer ta charge d'entraînement.</li><li>Tu peux les exporter ou les supprimer à tout moment dans Programme › Mes données.</li><li>Dans l'application iPhone, iOS te demandera aussi l'autorisation d'utiliser le Bluetooth.</li></ul></div></div>
   <div class="sheet-actions"><button class="btn full" data-act="consentOk">J'accepte et je connecte</button><button class="btn ghost full" data-act="closeSheet">Annuler</button></div>`,"Consentement");
}
function openLinkHr(rec){
  const t=iso(new Date(rec.start));const cands=[...sessions().filter(s=>Math.abs(diff(s.date,t))<=1).map(s=>({id:s.id,type:"muscu",label:tpl(s).name+" · "+fmtShort(s.date)})),...activeClub().filter(e=>Math.abs(diff(e.date,t))<=1).map(e=>({id:e.id,type:"club",label:(e.kind==="match"?"Match":"Séance club")+" · "+fmtShort(e.date)}))];
  openSheet(`<div class="sheet-scroll">${head("Enregistrement terminé","Associer les données cardiaques")}<div class="stack">
   <p class="small">${fmt(rec.durMin)} min · FC moy ${rec.avg??"—"} · max ${rec.max??"—"}${rec.source==="simulation"?' · <span class="sim-badge">Simulation</span>':""}</p>
   <p class="small muted">Durée et données cardiaques sont déjà enregistrées. Le RPE te sera demandé environ 30 min après la fin.</p>
   ${cands.map(c=>`<button class="date-pick" data-linkto="${c.id}" data-ltype="${c.type}" data-rec="${rec.id}"><span class="grow"><b>${esc(c.label)}</b></span></button>`).join("")}
   <button class="btn ghost full" data-act="closeSheet">Garder sans association</button></div></div>`,"Associer l'enregistrement");
}
function linkHr(recId,targetId,type){
  const rec=S.hr.find(r=>r.id===recId);if(!rec)return;
  const zonesMin=rec.zones?rec.zones.map(z=>Math.round(z/6)/10):null;
  if(type==="muscu"){const l=S.log[targetId]||{};S.log[targetId]={...l,dur:rec.durMin?Math.round(rec.durMin):l.dur,hrAvg:rec.avg,hrMax:rec.max,zones:zonesMin,hrId:rec.id,rpeDue:l.rpeDue||rec.end+18e5}}
  else{const o=S.club[targetId]||{};const a=o.actual||{};S.club[targetId]={...o,actual:sanitizeActual({...a,dur:rec.durMin?Math.round(rec.durMin):a.dur,hrAvg:rec.avg,hrMax:rec.max,zones:zonesMin,hrId:rec.id,src:rec.source==="simulation"?"simulation (données fictives)":"Polar ("+rec.source+")",at:a.at||nowISO()})}}
  rec.linked=targetId;save();Notify.scheduleRpe("rpe-"+targetId,rec.end+18e5,"séance");
}

