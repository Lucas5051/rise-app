/* =====================================================================
   DOMAINE · COACH · PROGRAMMES (création, duplication, édition, attribution, personnalisation)
   Fonctionne réellement avec les données locales (PL.programs, PL.assignments).
   ===================================================================== */
let CEDIT=null;   // {kind:"tpl"|"asg", id} : programme ouvert dans l'éditeur
let PSD=null;     // brouillon de la séance en cours d'édition {ps, wid, isNew}
let LIBF="all";   // filtre de la bibliothèque
const editProg=()=>!CEDIT?null:CEDIT.kind==="tpl"?PL.programs[CEDIT.id]:(PL.assignments[CEDIT.id]||{}).prog;
const editAsg=()=>CEDIT&&CEDIT.kind==="asg"?PL.assignments[CEDIT.id]:null;
function progChanged(what){const p=editProg();if(!p)return;if(CEDIT.kind==="tpl")touchProgram(p,what);else asgLog(editAsg(),what);plSave()}
const progUsers=p=>Object.values(PL.assignments).filter(a=>a.programId===p.id&&a.status==="active");
/* ---------- Liste des programmes ---------- */
function coachPrograms(){
  if(CEDIT)return programEditor();
  const ps=Object.values(PL.programs).sort((a,b)=>(a.status==="archived")-(b.status==="archived")||String(b.updatedAt).localeCompare(String(a.updatedAt)));
  return ch("Programmes")+`<div class="stack">
   <div class="row"><button class="btn" data-pe="create">${ICONS.plus}Créer un programme</button></div>
   ${ps.length?ps.map(p=>{const st=progStats(p),us=progUsers(p);return `<section class="card prog-card"><div class="row between"><h3>${esc(p.name)}</h3><span class="chip ${p.status==="active"?"st-done":p.status==="draft"?"st-todo":"st-future"}">${esc(PROG_STATUS[p.status]||p.status)}</span></div>
    <p class="small muted">${esc(p.goal||p.description||"Sans objectif renseigné")}${p.engine?" · séances calculées par le moteur historique (matchs réels)":""}</p>
    <p class="small">${st.weeks} semaine${st.weeks>1?"s":""} · ${st.sessions} séance${st.sessions>1?"s":""} · ${st.sets} séries · version ${p.version||1}${us.length?" · attribué à "+us.map(a=>esc(accountName(PL.accounts[a.clientId]))).join(", "):""}</p>
    <div class="row">${p.engine?`<button class="btn secondary small" data-pe="open" data-id="${p.id}">Consulter</button>`:`<button class="btn secondary small" data-pe="open" data-id="${p.id}">Modifier</button>`}<button class="btn ghost small" data-pe="dup" data-id="${p.id}">Dupliquer</button>${p.engine?"":`<button class="btn ghost small" data-pe="assign" data-id="${p.id}">Attribuer</button>`}${p.engine?"":p.status!=="archived"?`<button class="btn ghost small" data-pe="archive" data-id="${p.id}">Archiver</button>`:`<button class="btn ghost small" data-pe="unarchive" data-id="${p.id}">Réactiver</button>`}</div></section>`}).join(""):`<section class="card"><p class="small">Aucun programme. Crée ton premier modèle : blocs, semaines, séances et exercices.</p></section>`}
   <p class="tiny muted">Un modèle n'est jamais modifié par une attribution : chaque client reçoit une copie que tu peux personnaliser dans sa fiche.</p></div>`}
/* ---------- Éditeur ---------- */
function programEditor(){const p=editProg();if(!p){CEDIT=null;return coachPrograms()}
  const asg=editAsg();const ro=!!p.engine;const st=progStats(p);
  let h=ch(asg?"Programme de "+accountName(PL.accounts[asg.clientId]):p.name,asg?"Personnalisation (le modèle d'origine n'est pas modifié)":"Éditeur de programme",`<button class="btn ghost small" data-pe="close">${ICONS.back}${asg?"Fiche":"Programmes"}</button>`)+`<div class="stack">`;
  if(ro)h+=`<div class="demo-banner" role="note">Programme historique migré : ses séances réelles sont recalculées par le moteur selon les matchs, les entraînements à Caen et les semaines de cours. Ce modèle est affiché en lecture seule ; « Dupliquer » en fait une copie modifiable pour d'autres clients.</div>`;
  if(!asg)h+=`<section class="card stack"><h3>Informations</h3>
   <div class="grid2">${fld("pmName","Nom","text",p.name,null,ro?"disabled":"")}${fld("pmSport","Sport (facultatif)","text",p.sport||"",null,ro?"disabled":"")}</div>
   ${fld("pmGoal","Objectif","text",p.goal||"",null,ro?"disabled":"")}
   <div class="field"><label for="pmDesc">Description</label><textarea id="pmDesc" ${ro?"disabled":""}>${esc(p.description||"")}</textarea></div>
   <div class="grid2"><div class="field"><label for="pmLevel">Niveau</label><select id="pmLevel" ${ro?"disabled":""}>${PROG_LEVELS.map(([k,l])=>`<option value="${k}" ${p.level===k?"selected":""}>${l}</option>`).join("")}</select></div>
    <div class="field"><label for="pmStatus">Statut</label><select id="pmStatus" ${ro?"disabled":""}>${Object.entries(PROG_STATUS).map(([k,l])=>`<option value="${k}" ${p.status===k?"selected":""}>${l}</option>`).join("")}</select></div></div>
   <fieldset class="field"><legend class="lbl">Adaptations autorisées pour l'athlète</legend><div class="rule-grid">${Object.entries(RULE_L).map(([k,l])=>`<label><input type="checkbox" id="pmR_${k}" ${(p.rules||DEFAULT_RULES)[k]!==false?"checked":""} ${ro?"disabled":""}> ${l}</label>`).join("")}</div></fieldset>
   <p class="tiny muted">${st.weeks} semaines · ${st.sessions} séances · ${st.sets} séries · version ${p.version||1} · créé le ${fmtShort(String(p.createdAt).slice(0,10))} par ${esc(p.createdBy==="coach"?accountName(PL.accounts.coach):p.createdBy)}</p>
   ${ro?"":`<button class="btn secondary full" data-pe="saveMeta">Enregistrer les informations</button>`}</section>`;
  else h+=`<section class="card"><p class="small"><b>${esc((PL.programs[asg.programId]||{}).name||"Programme")}</b> · démarrage ${fmtLong(asg.startDate)} · fin ${asg.endDate?fmtShort(asg.endDate):"—"}${asg.customized?" · personnalisé":""}</p><div class="row" style="margin-top:8px"><button class="btn secondary small" data-pe="calendar" data-asg="${asg.id}">${ICONS.cal}Calendrier généré</button></div></section>`;
  let wn=0;
  (p.blocks||[]).forEach((b,bi)=>{h+=`<section class="card stack block-ed"><div class="row between" style="flex-wrap:nowrap"><div class="grow">${ro?`<h3>${esc(b.name)}</h3>`:`<label class="sr-only" for="bn_${b.id}">Nom du bloc</label><input class="inline-in h3-in" id="bn_${b.id}" data-pfield="b:${b.id}:name" value="${esc(b.name)}">`}</div>${ro||p.blocks.length<2?"":`<button class="btn ghost small" data-pe="delBlock" data-b="${b.id}" aria-label="Supprimer le bloc ${esc(b.name)}">${ICONS.cross}</button>`}</div>
    ${ro?`<p class="small muted">${esc(b.goal||"")}</p>`:`<div class="field"><label for="bg_${b.id}">Objectif du bloc</label><input id="bg_${b.id}" data-pfield="b:${b.id}:goal" value="${esc(b.goal||"")}"></div>`}`;
    b.weeks.forEach((w,wi)=>{wn++;const dates=asg?asgWeeks(asg).find(x=>x.w.id===w.id):null;
      h+=`<div class="week-ed"><div class="row between" style="flex-wrap:nowrap"><b>S${wn}${dates?" · "+fmtShort(dates.s):""}</b>${ro?`<span class="small muted grow">${esc(w.label)}</span>`:`<input class="inline-in grow" data-pfield="w:${w.id}:label" value="${esc(w.label||"")}" aria-label="Libellé de la semaine ${wn}" placeholder="Ex. : semaine de charge">`}
        ${ro?"":`<button class="btn ghost small" data-pe="dupWeek" data-w="${w.id}" aria-label="Dupliquer la semaine ${wn}">Dupliquer</button>${b.weeks.length>1||p.blocks.length>1?`<button class="btn ghost small" data-pe="delWeek" data-w="${w.id}" aria-label="Supprimer la semaine ${wn}">${ICONS.cross}</button>`:""}`}</div>
       <div class="sess-ed-list">${w.sessions.slice().sort((x,y)=>x.day-y.day).map(ps=>`<div class="sess-ed"><span class="datebox"><b>${DAYS_L[ps.day].slice(0,3)}</b><small>${esc(ps.time||"")}</small></span><div class="grow"><b>${esc(ps.name)}</b><div class="small muted">${ps.dur} min annoncées · estimation ${estimatePs(ps)} min · ${(ps.main||[]).length} exercices · ${setsOfRows(ps.main)} séries</div></div>
          ${ro?`<button class="btn ghost small" data-pe="viewSession" data-ps="${ps.id}">Voir</button>`:`<button class="btn secondary small" data-pe="editSession" data-ps="${ps.id}">Modifier</button><button class="btn ghost small" data-pe="dupSession" data-ps="${ps.id}" aria-label="Dupliquer ${esc(ps.name)}">Dupliquer</button><button class="btn ghost small" data-pe="moveSession" data-ps="${ps.id}">Déplacer</button><button class="btn ghost small" data-pe="delSession" data-ps="${ps.id}" aria-label="Supprimer ${esc(ps.name)}">${ICONS.cross}</button>`}</div>`).join("")||`<p class="small muted">Aucune séance cette semaine.</p>`}</div>
       ${ro?"":`<button class="btn ghost small" data-pe="addSession" data-w="${w.id}">${ICONS.plus}Ajouter une séance</button>`}</div>`});
    if(!ro)h+=`<button class="btn ghost small" data-pe="addWeek" data-b="${b.id}">${ICONS.plus}Ajouter une semaine à ce bloc</button>`;
    h+=`</section>`});
  if(!ro)h+=`<button class="btn secondary full" data-pe="addBlock">${ICONS.plus}Ajouter un bloc</button>`;
  if(!asg&&!ro)h+=`<div class="grid2"><button class="btn full" data-pe="assign" data-id="${p.id}">Attribuer à un client</button><button class="btn ghost full" data-pe="dup" data-id="${p.id}">Dupliquer</button></div>`;
  return h+`</div>`}
/* ---------- Séance : édition ---------- */
const INT_L=["Très légère","Légère","Modérée","Moyenne","Élevée","Maximale"];
const CAT_L={main:"Principal",acc:"Accessoire",prev:"Prévention"};
/* Éditeur de séance : voir 136-session-editor.js (4 étapes) */
function openMovePs(psId){const p=editProg();const f=findPs(p,psId);let n=0;sheetMode="psMove";
  openSheet(`<div class="sheet-scroll">`+head("Déplacer",esc(f.ps.name))+`<div class="stack"><div class="grid2"><div class="field"><label for="mvW">Semaine</label><select id="mvW">${progWeeks(p).map(x=>{n++;return `<option value="${x.w.id}" ${x.w.id===f.w.id?"selected":""}>S${n} · ${esc(x.b.name)}${x.w.label?" · "+esc(x.w.label):""}</option>`}).join("")}</select></div>
   <div class="field"><label for="mvD">Jour</label><select id="mvD">${DAYS_L.map((d,i)=>`<option value="${i}" ${+f.ps.day===i?"selected":""}>${d}</option>`).join("")}</select></div></div>
   <p class="tiny muted">Les athlètes à qui ce programme a déjà été attribué gardent leur copie ; modifie leur programme personnalisé si besoin.</p></div></div>
   <div class="sheet-actions"><button class="btn full" data-pe="saveMove" data-ps="${psId}">Déplacer la séance</button></div>`,"Déplacer une séance")}
/* ---------- Attribution ---------- */
function openAssign(pidv,clientId){const p=PL.programs[pidv];const ath=athletes();sheetMode="assign";let n=0;
  if(!ath.length){toast("Aucun client : invite d'abord un client");return}
  openSheet(`<div class="sheet-scroll">`+head("Attribuer",esc(p.name))+`<div class="stack">
   <div class="field"><label for="asClient">Client</label><select id="asClient">${ath.map(a=>`<option value="${a.id}" ${a.id===clientId?"selected":""}>${esc(accountName(a))}${assignmentOf(a.id)?" (programme en cours)":""}</option>`).join("")}</select></div>
   <div class="grid2">${fld("asStart","Date de démarrage","date",todayISO())}<div class="field"><label for="asWeek">Commencer à</label><select id="asWeek">${progWeeks(p).map(x=>{n++;return `<option value="${n-1}">Semaine ${n} · ${esc(x.b.name)}</option>`}).join("")}</select></div></div>
   <p class="small muted">La semaine choisie commence le lundi de la semaine de démarrage ; les séances placées avant la date de démarrage ne sont pas générées. Si le client a déjà un programme en cours, il est terminé (son historique est conservé).</p>
   <div id="asChecks">${clientId?checksHtml(profileChecks(clientId,p)):'<p class="small muted">Choisis un client pour vérifier le programme avec son questionnaire.</p>'}</div>
   ${(()=>{const mt=clientId?missingTestsFor(p,clientId):[];return mt.length?`<div class="alert"><span class="dot"></span><div class="small"><b>Tests manquants pour ce client :</b> ${mt.map(r=>esc(refLabel(r))).join(", ")}. Les charges en % resteront « Test requis » jusqu'à la saisie.</div></div>`:""})()}
   <p class="small" id="asMsg" role="alert"></p></div></div><div class="sheet-actions"><button class="btn full" data-pe="doAssign" data-id="${p.id}">Attribuer et générer le calendrier</button></div>`,"Attribuer un programme")}
function doAssign(pidv){const c=val("asClient"),d=val("asStart"),w=+val("asWeek")||0;if(!c||!d){document.getElementById("asMsg").textContent="Choisis le client et la date.";return}
  const a=assignProgram({clientId:c,programId:pidv,startDate:d,startWeek:w,coachId:"coach"});closeSheet(false);
  const first=withAthlete(c,()=>{const s=sessions().find(x=>x.date>=todayISO());return s?tpl(s).name+" le "+fmtLong(s.date):null});
  CEDIT=null;CTAB="athlete";CATH=c;CATH_SUB="plan";render();window.scrollTo(0,0);toast("Programme attribué"+(first?" · 1re séance : "+first:""))}
function sheetAsgCalendar(aid){const a=PL.assignments[aid];const rows=withAthlete(a.clientId,()=>sessions().map(s=>`<tr><td>${fmtShort(s.date)}</td><td>${esc(s.week)}</td><td>${esc(tpl(s).name)}</td><td>${esc(STATUS_LABEL[displayStatus(s)])}</td></tr>`).join(""));
  return `<div class="sheet-scroll">`+head(esc(accountName(PL.accounts[a.clientId])),"Calendrier généré")+`<div class="stack"><p class="small">Du ${fmtLong(a.startDate)} au ${a.endDate?fmtLong(a.endDate):"—"}.</p><div class="tablewrap"><table><thead><tr><th>Date</th><th>Sem.</th><th>Séance</th><th>Statut</th></tr></thead><tbody>${rows||'<tr><td colspan="4">Aucune séance générée.</td></tr>'}</tbody></table></div></div></div>`}
/* ---------- Bibliothèque ---------- */
function coachLibrary(){const names=allExerciseNames();const all=names.map(n=>({n,f:exLib(n)}));const cnt=k=>all.filter(x=>k==="all"||mediaState(x.f)===k).length;
  const list=all.filter(x=>LIBF==="all"||mediaState(x.f)===LIBF);const used=storageUse();
  return ch("Bibliothèque")+`<div class="stack"><p class="small muted">Chaque exercice des programmes a une fiche. Ajoute une photo (compressée sur l'appareil) ou un lien vers une vidéo dont tu possèdes les droits. Aucune vidéo n'est téléchargée ni inventée.</p>
   <p class="small ${used.pct>80?"warn-txt":""}">Stockage local utilisé : ${fmtKb(used.bytes)} (≈ ${used.pct} % de la limite habituelle de 5 Mo).</p>
   <div class="seg seg-scroll" role="tablist" aria-label="Filtrer les médias">${[["all","Tous"],["complet","Média complet"],["photo","Photo uniquement"],["video","Vidéo uniquement"],["manquant","Média manquant"]].map(([k,l])=>`<button role="tab" aria-selected="${LIBF===k}" data-libf="${k}">${l} (${cnt(k)})</button>`).join("")}</div>
   <section class="card">${list.map(({n,f})=>{const st=mediaState(f);return `<div class="list-item lib-row" style="cursor:default">${f.photo||f.photoFront?`<img class="ex-thumb" src="${esc(mediaSrc(f.photo||f.photoFront))}"${mediaAttr(f.photo||f.photoFront)} alt="">`:exThumb(n)}<div class="grow"><b>${esc(n)}</b><div class="small muted">${esc(EX_CATS[f.cat]||"")} · ${esc(MEDIA_L[st])}${f.status==="a_completer"?" · fiche à compléter":""}</div></div><button class="btn secondary small" data-libedit="${esc(n)}">Fiche</button></div>`}).join("")||'<p class="small muted">Aucun exercice dans ce filtre.</p>'}</section></div>`}
function openLibEdit(name){const f=exLib(name),c=PL.library[name]||{};sheetMode="libEdit";
  const img=(k,l)=>`<div class="lib-media"><span class="small"><b>${l}</b> ${c[k]?(isSbMedia(c[k])?"· sur le serveur":"· "+fmtKb(c[k].length*.75)):"· aucune"}</span>${c[k]?`<img src="${esc(mediaSrc(c[k]))}"${mediaAttr(c[k])} alt="${l} : ${esc(name)}" class="lib-prev"><button class="btn ghost small" data-libdel="${esc(name)}" data-k="${k}">Retirer</button>`:""}<label class="btn secondary small">${c[k]?"Remplacer":"Ajouter"}<input type="file" accept="image/jpeg,image/png,image/webp" hidden data-libphoto="${esc(name)}" data-k="${k}"></label></div>`;
  openSheet(`<div class="sheet-scroll">`+head("Fiche d'exercice",esc(name))+`<div class="stack">
   <div class="grid2"><div class="field"><label for="lbCat">Catégorie</label><select id="lbCat">${Object.entries(EX_CATS).map(([k,l])=>`<option value="${k}" ${f.cat===k?"selected":""}>${l}</option>`).join("")}</select></div>${fld("lbEq","Matériel","text",f.equip)}</div>
   ${fld("lbMu","Muscles ou zones principales","text",f.muscles)}
   ${[0,1,2].map(i=>fld("lbC"+i,"Consigne "+(i+1),"text",f.cues[i]||"")).join("")}
   <div class="field"><label for="lbErr">Erreurs fréquentes (une par ligne)</label><textarea id="lbErr">${esc(f.errors.join("\n"))}</textarea></div>
   ${fld("lbAlt","Alternative","text",f.alt)}
   <h3>Médias</h3>${img("photo","Photo")}${img("photoFront","Vue de face")}${img("photoSide","Vue de profil")}
   ${Cloud.isCloud()?`<div class="field"><label for="lbVidF">Vidéo (MP4 ou MOV, 50 Mo max, envoyée sur le serveur)</label><input id="lbVidF" type="file" accept="video/mp4,video/quicktime" data-libvideo="${esc(name)}">${isSbMedia(c.video)?`<p class="tiny muted">Vidéo enregistrée sur le serveur. <button type="button" class="btn ghost small" data-libdel="${esc(name)}" data-k="video">Retirer</button></p>`:""}</div>`:""}
   <div class="field"><label for="lbVid">Lien de la vidéo (MP4 hébergé, droits détenus)</label><input id="lbVid" type="url" inputmode="url" value="${esc(isSbMedia(c.video)?"":c.video||"")}" placeholder="https://…"></div>
   ${fld("lbRights","Droits du média","text",c.rights||"",null,'placeholder="Ex. : vidéo tournée par le coach"')}
   <div class="field"><label for="lbStatus">Statut de publication</label><select id="lbStatus">${[["publie","Publiée"],["brouillon","Brouillon"],["a_completer","À compléter"]].map(([k,l])=>`<option value="${k}" ${f.status===k?"selected":""}>${l}</option>`).join("")}</select></div>
   <p class="tiny muted">Photos : JPEG, PNG ou WebP, 8 Mo maximum avant compression ; elles sont réduites à 720 px. Une vidéo choisie depuis l'appareil n'est jamais enregistrée : seul un lien l'est.</p>
   <p class="small" id="lbMsg" role="alert"></p></div></div><div class="sheet-actions"><button class="btn full" data-libsave="${esc(name)}">Enregistrer la fiche</button></div>`,"Fiche d'exercice")}
function saveLibEdit(name){const c=PL.library[name]=PL.library[name]||{};const v=val("lbVid").trim()||(isSbMedia(c.video)?c.video:"");
  if(v&&!isSbMedia(v)&&!/^https:\/\/\S+$/.test(v)){document.getElementById("lbMsg").textContent="Le lien vidéo doit commencer par https://";return}
  Object.assign(c,{cat:val("lbCat"),equip:val("lbEq").trim(),muscles:val("lbMu").trim(),cues:[0,1,2].map(i=>val("lbC"+i).trim()).filter(Boolean),errors:val("lbErr").split("\n").map(x=>x.trim()).filter(Boolean),alt:val("lbAlt").trim(),video:v||null,rights:val("lbRights").trim(),status:val("lbStatus"),dirty:true});
  PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Fiche mise à jour : "+name});if(!plSave()){document.getElementById("lbMsg").textContent="Stockage plein : fiche non enregistrée.";return}closeSheet(false);render();toast("Fiche enregistrée")}
/* Stockage et médias : compression, taille, limites, alerte avant dépassement */
function storageUse(){let b=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);b+=(k.length+(localStorage.getItem(k)||"").length)*2}}catch(e){}return{bytes:b,pct:Math.round(b/(5*1024*1024)*100)}}
const fmtKb=b=>b>1048576?fmt(b/1048576,1)+" Mo":Math.round(b/1024)+" ko";
const MEDIA_MAX_IN=8*1024*1024;
function libPhotoK(name,k,file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)){toast("Format accepté : JPEG, PNG ou WebP");return}
  if(file.size>MEDIA_MAX_IN){toast("Image trop lourde (8 Mo maximum)");return}
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),q=Math.min(1,720/Math.max(img.width,img.height));c.width=Math.round(img.width*q);c.height=Math.round(img.height*q);c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    const data=c.toDataURL("image/jpeg",.78);if(Cloud.isCloud()){uploadMedia(name,k,dataUrlBlob(data),"image/jpeg");return}const add=data.length*2;const u=storageUse();
    if(u.bytes+add>4.5*1024*1024){toast("Stockage presque plein : retire d'abord un média");return}
    const L=PL.library[name]=PL.library[name]||{};const prev=L[k];L[k]=data;if(!L.rights)L.rights="Photo ajoutée par le coach";
    if(!plSave()){if(prev)L[k]=prev;else delete L[k];toast("Stockage plein : photo non enregistrée");return}
    PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Photo ajoutée ("+k+") : "+name+" · "+fmtKb(data.length*.75)});plSave();
    if(sheetMode==="libEdit")openLibEdit(name);render();toast("Photo enregistrée ("+fmtKb(data.length*.75)+")")};img.onerror=()=>toast("Image illisible");img.src=r.result};r.readAsDataURL(file)}
/* ---------- Événements ---------- */
document.addEventListener("click",ev=>{const t=ev.target;
  const lf=t.closest("[data-libf]");if(lf){LIBF=lf.dataset.libf;render();return}
  const le=t.closest("[data-libedit]");if(le){openLibEdit(le.dataset.libedit);return}
  const ls=t.closest("[data-libsave]");if(ls){saveLibEdit(ls.dataset.libsave);return}
  const ld=t.closest("[data-libdel]");if(ld){const L=PL.library[ld.dataset.libdel];if(L){if(isSbMedia(L[ld.dataset.k]))deleteMedia(L[ld.dataset.k].slice(3));delete L[ld.dataset.k];plSave();openLibEdit(ld.dataset.libdel);render();toast("Média retiré")}return}
  const el=t.closest("[data-pe]");if(!el||!isCoachAccount())return;const a=el.dataset.pe;
  const p=editProg();
  switch(a){
   case "create":{const n=newProgram({createdBy:"coach"});PL.programs[n.id]=n;PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Programme créé : "+n.name});plSave();CEDIT={kind:"tpl",id:n.id};render();window.scrollTo(0,0);setTimeout(()=>{const i=document.getElementById("pmName");i&&i.focus()},50);break}
   case "open":CEDIT={kind:"tpl",id:el.dataset.id};render();window.scrollTo(0,0);break;
   case "close":{const asg=editAsg();CEDIT=null;if(asg){CTAB="athlete";CATH=asg.clientId;CATH_SUB="plan"}render();window.scrollTo(0,0);break}
   case "dup":{const src=PL.programs[el.dataset.id];const c=src.engine?cloneProgram(legacyProgramSnapshot(),{name:"Copie de "+src.name.replace(" · Lucas"," "),description:"Copie modifiable du programme historique (séances figées au calendrier d'origine, sans les matchs réels).",createdBy:"coach"}):cloneProgram(src,{name:"Copie de "+src.name,createdBy:"coach"});
     PL.programs[c.id]=c;PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Programme dupliqué : "+src.name+" → "+c.name});plSave();CEDIT={kind:"tpl",id:c.id};render();window.scrollTo(0,0);toast("Programme dupliqué");break}
   case "archive":case "unarchive":{const x=PL.programs[el.dataset.id];x.status=a==="archive"?"archived":"active";touchProgram(x,a==="archive"?"Programme archivé":"Programme réactivé");plSave();render();break}
   case "saveMeta":{p.name=val("pmName").trim()||p.name;p.sport=val("pmSport").trim();p.goal=val("pmGoal").trim();p.description=val("pmDesc").trim();p.level=val("pmLevel");p.status=val("pmStatus");
     p.rules={};Object.keys(RULE_L).forEach(k=>p.rules[k]=!!(document.getElementById("pmR_"+k)||{}).checked);progChanged("Informations modifiées");render();toast("Informations enregistrées");break}
   case "addBlock":p.blocks.push(newBlock("Bloc "+(p.blocks.length+1)));progChanged("Bloc ajouté");render();break;
   case "delBlock":{const b=p.blocks.find(x=>x.id===el.dataset.b);if(b.weeks.some(w=>w.sessions.length)&&!el.dataset.ok){el.dataset.ok=1;el.textContent="Confirmer la suppression";return}p.blocks=p.blocks.filter(x=>x.id!==el.dataset.b);progChanged("Bloc supprimé : "+b.name);render();break}
   case "addWeek":{const b=p.blocks.find(x=>x.id===el.dataset.b);b.weeks.push(newWeek("Semaine "+(b.weeks.length+1)));progChanged("Semaine ajoutée");render();break}
   case "dupWeek":{for(const b of p.blocks){const i=b.weeks.findIndex(w=>w.id===el.dataset.w);if(i>=0){const c=deep(b.weeks[i]);c.id=pid("pw");c.label=(c.label||"Semaine")+" (copie)";c.sessions.forEach(s=>s.id=pid("ps"));b.weeks.splice(i+1,0,c);break}}progChanged("Semaine dupliquée");render();break}
   case "delWeek":{for(const b of p.blocks){const w=b.weeks.find(x=>x.id===el.dataset.w);if(w){if(w.sessions.length&&!el.dataset.ok){el.dataset.ok=1;el.textContent="Confirmer";return}b.weeks=b.weeks.filter(x=>x!==w)}}p.blocks=p.blocks.filter(b=>b.weeks.length||p.blocks.length===1);progChanged("Semaine supprimée");render();break}
   case "addSession":openPsEditor(null,el.dataset.w,false);break;
   case "editSession":openPsEditor(el.dataset.ps,null,false);break;
   case "viewSession":openPsEditor(el.dataset.ps,null,true);break;
   case "delSession":{const f=findPs(p,el.dataset.ps);if(!el.dataset.ok){el.dataset.ok=1;el.textContent="Confirmer";el.setAttribute("aria-label","Confirmer la suppression de "+f.ps.name);return}f.w.sessions=f.w.sessions.filter(x=>x.id!==f.ps.id);progChanged("Séance supprimée : "+f.ps.name);render();toast("Séance supprimée");break}
   case "dupSession":{const f=findPs(p,el.dataset.ps);const c=deep(f.ps);c.id=pid("ps");c.name=f.ps.name+" (copie)";f.w.sessions.push(c);progChanged("Séance dupliquée : "+f.ps.name);render();toast("Séance dupliquée");break}
   case "moveSession":openMovePs(el.dataset.ps);break;
   case "saveMove":{const f=findPs(p,el.dataset.ps);const tw=progWeeks(p).find(x=>x.w.id===val("mvW")).w;const d=+val("mvD");f.w.sessions=f.w.sessions.filter(x=>x!==f.ps);f.ps.day=d;tw.sessions.push(f.ps);progChanged("Séance déplacée : "+f.ps.name+" → "+DAYS_L[d]);closeSheet(false);render();toast("Séance déplacée");break}
   case "saveSession":savePs();break;
   case "exAdd":psRead();PSD.ps.main.push({n:"",sets:3,reps:"8",rest:"90 s",rir:"RIR 2",load:"",cat:"main"});psRefresh();setTimeout(()=>{const i=document.getElementById("exn"+(PSD.ps.main.length-1));i&&i.focus()},30);break;
   case "exDel":psRead();PSD.ps.main.splice(+el.dataset.i,1);psRefresh();break;
   case "exUp":case "exDown":{psRead();const i=+el.dataset.i,j=a==="exUp"?i-1:i+1;const m=PSD.ps.main;[m[i],m[j]]=[m[j],m[i]];psRefresh();break}
   case "warmAdd":psRead();(PSD.ps[el.dataset.wk]=PSD.ps[el.dataset.wk]||[]).push({n:"",dose:"",cue:"",type:el.dataset.wk==="wu"?"activation":"étirement",alt:""});psRefresh();break;
   case "warmDel":psRead();PSD.ps[el.dataset.wk].splice(+el.dataset.i,1);psRefresh();break;
   case "assign":openAssign(el.dataset.id,el.dataset.client);break;
   case "pickProg":{const c=el.dataset.client;sheetMode="pickProg";openSheet(`<div class="sheet-scroll">`+head(esc(accountName(PL.accounts[c])),"Choisir un programme")+`<div class="stack tight">${Object.values(PL.programs).filter(x=>!x.engine&&x.status!=="archived").map(x=>`<button class="date-pick" data-pe="assign" data-id="${x.id}" data-client="${c}"><span class="grow"><b>${esc(x.name)}</b><span class="small muted"> · ${progStats(x).weeks} sem.</span></span></button>`).join("")}</div></div>`,"Choisir un programme");break}
   case "doAssign":doAssign(el.dataset.id);break;
   case "calendar":sheetMode="asgCal";openSheet(sheetAsgCalendar(el.dataset.asg),"Calendrier généré");break;
   case "customize":CEDIT={kind:"asg",id:el.dataset.asg};CTAB="programs";render();window.scrollTo(0,0);break;
   case "endAsg":{const x=PL.assignments[el.dataset.asg];if(!el.dataset.ok){el.dataset.ok=1;el.textContent="Confirmer : terminer le programme";return}x.status="ended";x.endDate=todayISO();x.history.push({at:nowISO(),by:"coach",what:"Programme terminé par le coach"});plSave();render();toast("Programme terminé");break}
  }
});
document.addEventListener("change",ev=>{const t=ev.target;
  if(t.id==="ivProg"){const p=PL.programs[t.value];const w=document.getElementById("ivWeek");if(w){let n=0;w.innerHTML=p?progWeeks(p).map(x=>{n++;return `<option value="${n-1}">Semaine ${n} · ${esc(x.b.name)}${x.w.label?" · "+esc(x.w.label):""}</option>`}).join(""):'<option value="0">Semaine 1</option>'}}
  if(t.id==="ruleUid"){RULE_UID=t.value;render()}
  if(t.dataset&&t.dataset.pfield&&isCoachAccount()){const p=editProg();if(!p)return;const [k,id,f]=t.dataset.pfield.split(":");
    if(k==="b"){const b=p.blocks.find(x=>x.id===id);if(b){b[f]=t.value.trim();progChanged("Bloc modifié : "+b.name)}}
    if(k==="w"){const w=progWeeks(p).find(x=>x.w.id===id);if(w){w.w[f]=t.value.trim();progChanged("Semaine renommée")}}}
  if(t.dataset&&t.dataset.libvideo&&t.files&&t.files[0]&&isCoachAccount())uploadMedia(t.dataset.libvideo,"video",t.files[0],t.files[0].type);
  if(t.dataset&&t.dataset.libphoto&&t.files&&t.files[0]&&isCoachAccount())libPhotoK(t.dataset.libphoto,t.dataset.k||"photo",t.files[0]);
});
document.addEventListener("input",ev=>{if(!ev.target.closest||!ev.target.closest("#psForm")||!PSD)return;psRead();const e=document.getElementById("psEst");if(e)e.textContent="Estimation : "+estimatePs(PSD.ps)+" min (échauffement + exercices, repos et transitions + retour au calme)."});

